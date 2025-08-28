import React, { useState, useEffect, useRef } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Snackbar,
  Alert,
  Stack,
  Button,
  IconButton,
  Chip,
  Fade,
  useTheme,
  useMediaQuery,
  Divider,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  Checkbox,
  CircularProgress,
  MenuItem
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import NumericKeypad from '../components/NumericKeypad';
import * as inventoryService from '../services/inventoryService';
import { InventoryItem } from '../types';
import { format } from 'date-fns';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import QrCodeIcon from '@mui/icons-material/QrCode';
import LocalAtmIcon from '@mui/icons-material/LocalAtm';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import EmailIcon from '@mui/icons-material/Email';
import { initEmailService, sendInventoryReport } from '../utils/emailService';
import { deleteInventoryItems } from '../services/inventoryService';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import * as XLSX from "xlsx";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
// @ts-ignore
import html2pdf from 'html2pdf.js';
import RobotoNormal from '../fonts/Roboto-normal';
import SearchIcon from '@mui/icons-material/Search';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
// TypeScript dosyanın en üstüne:

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const Inventory: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useAuth();
  const navigate = useNavigate();
  const [countStr, setCountStr] = useState<string>('1');
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [lastAddedItem, setLastAddedItem] = useState<InventoryItem | null>(null);
  
  // Silme için durum değişkenleri
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  
  // Güncelleme için durum değişkenleri
  const [updateDialogOpen, setUpdateDialogOpen] = useState<boolean>(false);
  const [itemToUpdate, setItemToUpdate] = useState<InventoryItem | null>(null);
  const [newCount, setNewCount] = useState<string>('1');
  
  // Email gönderme için durum değişkenleri
  const [emailDialogOpen, setEmailDialogOpen] = useState<boolean>(false);
  const [recipientEmail, setRecipientEmail] = useState<string>('');
  const [emailSending, setEmailSending] = useState<boolean>(false);
  
  const [alert, setAlert] = useState<{
    open: boolean;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    type: 'info'
  });

  // Çoklu seçim için state
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);



  // Stok sorgulama dialog state
  const [stockDialogOpen, setStockDialogOpen] = useState(false);
  const [stockQueryBarcode, setStockQueryBarcode] = useState('');
  const [stockQueryResult, setStockQueryResult] = useState<{ name: string; stock: number } | null>(null);
  const [stockQueryLoading, setStockQueryLoading] = useState(false);

  // Aktarım için ek state
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [users, setUsers] = useState<{ username: string; name: string }[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [transferLoading, setTransferLoading] = useState(false);
  // --- Pending transfer için ek state ---
  const [pendingTransfer, setPendingTransfer] = useState<{ from: string; to: string } | null>(null);
  const [pendingTransferDialogOpen, setPendingTransferDialogOpen] = useState(false);



  // PDF'e dönüştürülecek tablo için ref
  const pdfRef = useRef<HTMLDivElement>(null);

  // Barkod inputu için ref ekle
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Barkod inputunda hızlı (okuyucu) ve yavaş (elle) giriş ayrımı için zaman ölçümü state'i ekle
  const [barcodeInputTime, setBarcodeInputTime] = useState<number>(Date.now());



  // EmailJS servisini başlat
  useEffect(() => {
    initEmailService();
  }, []);

  // Bildirim gösterme
  const showAlert = (message: string, type: 'success' | 'error' | 'info' | 'warning') => {
    setAlert({
      open: true,
      message,
      type
    });
  };
  
  // Sayfa yüklendiğinde mevcut stok sayım verilerini getir
  useEffect(() => {
    loadInventoryData();
  }, []);
  
  // Stok verilerini yükle
  const loadInventoryData = async () => {
    try {
      const items = await inventoryService.getAllInventoryItems();
      // Sadece giriş yapan kullanıcının kayıtlarını filtrele
      const userItems = items.filter(item => item.countedBy === user?.name);
      // Son eklenen öğeleri üste getir
      const sortedItems = userItems.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      setInventoryItems(sortedItems);
    } catch (error) {
      console.error('Stok verileri yüklenirken hata oluştu:', error);
      showAlert('Stok verileri yüklenirken hata oluştu', 'error');
    }
  };
  
  // handleNumberEntered fonksiyonunu güncelle
  const handleNumberEntered = () => {
    // Adet girildikten sonra barkod inputuna odaklan
    setTimeout(() => {
      barcodeInputRef.current?.focus();
    }, 100);
  };


  
  // Barkod normalize fonksiyonu
  function normalizeBarcode(barcode: string) {
    let normalized = barcode;
    if (normalized.endsWith('999')) {
      normalized = normalized.slice(0, -3);
    } else if (normalized.endsWith('99')) {
      normalized = normalized.slice(0, -2);
    }
    return normalized;
  }

  const handleBarcodeDetected = async (barcode: string) => {
    if (!barcode || !user) return;
    // Barkodu normalize et
    const normalizedBarcode = normalizeBarcode(barcode);
    
    try {
      const count = parseInt(countStr) || 1;
      const result = await inventoryService.addOrUpdateInventoryItem(
        barcode,
        count,
        user.name
      );
      loadInventoryData();
      setLastAddedItem(result);
      const isNewItem = result.count === count;
      const message = isNewItem
        ? `${result.name} başarıyla sayıldı (${count} adet)`
        : `${result.name} sayımı güncellendi (${result.count} adet, son eklenen: ${count} adet)`;
      showAlert(message, 'success');
      setTimeout(() => {
        setLastAddedItem(null);
      }, 5000);
    } catch (error) {
      console.error('Ürün sayımı eklenirken hata oluştu:', error);
      showAlert('Ürün sayımı eklenirken hata oluştu', 'error');
    }
  };
  
  // Silme işlemini başlat
  const handleDeleteClick = (id: string) => {
    setItemToDelete(id);
    setDeleteDialogOpen(true);
  };
  
  // Silme işlemini iptal et
  const handleCancelDelete = () => {
    setItemToDelete(null);
    setDeleteDialogOpen(false);
  };
  
  // Silme işlemini onayla
  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    
    try {
      const success = await inventoryService.deleteInventoryItem(itemToDelete);
      if (success) {
        showAlert('Sayım kaydı başarıyla silindi', 'success');
        loadInventoryData();
      } else {
        showAlert('Sayım kaydı silinirken hata oluştu', 'error');
      }
    } catch (error) {
      showAlert('Sayım kaydı silinirken hata oluştu', 'error');
    } finally {
      setItemToDelete(null);
      setDeleteDialogOpen(false);
    }
  };
  
  // Güncelleme işlemini başlat
  const handleUpdateClick = (item: InventoryItem) => {
    setItemToUpdate(item);
    setNewCount(item.count.toString());
    setUpdateDialogOpen(true);
  };
  
  // Güncelleme işlemini iptal et
  const handleCancelUpdate = () => {
    setItemToUpdate(null);
    setUpdateDialogOpen(false);
  };
  
  // Güncelleme işlemini onayla
  const handleConfirmUpdate = async () => {
    if (!itemToUpdate || !user) return;
    
    try {
      const count = parseInt(newCount) || 1;
      const result = await inventoryService.updateInventoryItem(
        itemToUpdate.id,
        count,
        user.name
      );
      
      if (result) {
        showAlert(`${result.name} sayımı başarıyla güncellendi (${count} adet)`, 'success');
        loadInventoryData();
      } else {
        showAlert('Sayım kaydı güncellenirken hata oluştu', 'error');
      }
    } catch (error) {
      showAlert('Sayım kaydı güncellenirken hata oluştu', 'error');
    } finally {
      setItemToUpdate(null);
      setUpdateDialogOpen(false);
    }
  };
  
  // Email gönderme diyaloğunu aç
  const handleEmailClick = () => {
    if (inventoryItems.length === 0) {
      showAlert('Gönderilecek stok sayım verisi bulunamadı', 'warning');
      return;
    }
    setEmailDialogOpen(true);
  };
  
  // Email gönderme işlemini iptal et
  const handleCancelEmail = () => {
    setRecipientEmail('');
    setEmailDialogOpen(false);
  };
  
  // Email gönderme işlemini onayla
  const handleSendEmail = async () => {
    if (!user || !recipientEmail) return;
    
    try {
      setEmailSending(true);
      
      const success = await sendInventoryReport(
        inventoryItems,
        recipientEmail,
        user.name
      );
      
      if (success) {
        showAlert('Stok sayım raporu başarıyla gönderildi', 'success');
      } else {
        showAlert('Rapor gönderilirken bir hata oluştu', 'error');
      }
    } catch (error) {
      showAlert('Rapor gönderilirken bir hata oluştu', 'error');
    } finally {
      setEmailSending(false);
      setRecipientEmail('');
      setEmailDialogOpen(false);
    }
  };
  
  // Excel'e aktar
  const handleExportToExcel = () => {
    if (inventoryItems.length === 0) {
      showAlert('Dışa aktarılacak veri bulunamadı', 'warning');
      return;
    }
    
    try {
      inventoryService.exportToExcel(inventoryItems);
      showAlert('Stok sayım raporu başarıyla indirildi', 'success');
    } catch (error) {
      console.error('Excel dışa aktarımı sırasında hata:', error);
      showAlert('Excel dışa aktarımı sırasında hata oluştu', 'error');
    }
  };
  
  // Tarihi formatla
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'dd.MM.yyyy HH:mm');
    } catch (error) {
      return dateString;
    }
  };
  
  // Checkbox değişimini yönet
  const handleSelectItem = (id: string) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]
    );
  };

  // Tümünü seç
  const handleSelectAll = () => {
    if (selectedItems.length === inventoryItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(inventoryItems.map((item) => item.id));
    }
  };

  // Toplu silme işlemini başlat
  const handleBulkDeleteClick = () => {
    setBulkDeleteDialogOpen(true);
  };

  // Toplu silme işlemini iptal et
  const handleCancelBulkDelete = () => {
    setBulkDeleteDialogOpen(false);
  };

  // Toplu silme işlemini onayla
  const handleConfirmBulkDelete = async () => {
    if (selectedItems.length === 0) return;
    try {
      const deletedCount = await deleteInventoryItems(selectedItems);
      if (deletedCount > 0) {
        showAlert(`${deletedCount} kayıt başarıyla silindi`, 'success');
        setSelectedItems([]);
        loadInventoryData();
      } else {
        showAlert('Kayıtlar silinirken hata oluştu', 'error');
      }
    } catch (error) {
      showAlert('Kayıtlar silinirken hata oluştu', 'error');
    } finally {
      setBulkDeleteDialogOpen(false);
    }
  };





  // Stok sorgulama dialog state
  const [showStockScanner, setShowStockScanner] = useState(false);
  const handleStockBarcodeScanned = (barcode: string) => {
    setStockQueryBarcode(barcode);
    setShowStockScanner(false);
    setTimeout(() => handleStockQuery(), 200); // Otomatik sorgula
  };
  const handleStockQuery = async () => {
    if (!stockQueryBarcode) return;
    setStockQueryLoading(true);
    setStockQueryResult(null);
    // Barkodun sonundaki : ve sonrası ekleri temizle
    const cleanBarcode = stockQueryBarcode.split(':')[0];
    try {
      const res = await fetch(`${API_URL}/api/stock-query/${cleanBarcode}`);
      const data = await res.json();
      setStockQueryResult({ name: data.name, stock: data.stock });
      setStockQueryLoading(false);
    } catch (err) {
      setStockQueryResult({ name: 'Ürün bulunamadı', stock: 0 });
      setStockQueryLoading(false);
    }
  };

  // Aktarım dialogunu aç
  const handleOpenTransferDialog = async () => {
    setTransferDialogOpen(true);
    setSelectedUser('');
    try {
      const res = await axios.get(`${API_URL}/users`);
      if (res.data && (res.data as any).users) setUsers((res.data as any).users);
    } catch {}
  };
  const handleCloseTransferDialog = () => {
    setTransferDialogOpen(false);
    setSelectedUser('');
  };
  const handleTransfer = async () => {
    setTransferLoading(true);
    try {
      // Pending transfer kaydı bırak
      if (selectedUser) {
        localStorage.setItem(`pendingTransfer_${selectedUser}`, JSON.stringify({ from: user?.name, to: selectedUser }));
      }
      showAlert('Aktarım isteği gönderildi. Hedef kullanıcı onayladığında aktarılacak.', 'success');
      setTransferDialogOpen(false);
    } catch {
      showAlert('Aktarım sırasında hata oluştu', 'error');
    } finally {
      setTransferLoading(false);
    }
  };

  // --- Pending transfer kontrolü ---
  useEffect(() => {
    if (user?.name) {
      const pending = localStorage.getItem(`pendingTransfer_${user.name}`);
      if (pending) {
        setPendingTransfer(JSON.parse(pending));
        setPendingTransferDialogOpen(true);
      }
    }
  }, [user?.name]);

  const handleAcceptPendingTransfer = async () => {
    if (pendingTransfer && pendingTransfer.from && user?.name) {
      await inventoryService.transferInventoryToUser(pendingTransfer.from, user.name);
      localStorage.removeItem(`pendingTransfer_${user.name}`);
      setPendingTransferDialogOpen(false);
      setPendingTransfer(null);
      showAlert('Sayım listesi başarıyla aktarıldı!', 'success');
      loadInventoryData();
    }
  };
  const [rejectedTransferUser, setRejectedTransferUser] = useState<string | null>(null);
  const handleRejectPendingTransfer = () => {
    if (user?.name && pendingTransfer?.from) {
      // Red eden kullanıcıyı aktaran kullanıcıya bildir
      localStorage.setItem(`rejectedTransfer_${pendingTransfer.from}`, user.name);
      localStorage.removeItem(`pendingTransfer_${user.name}`);
      setPendingTransferDialogOpen(false);
      setPendingTransfer(null);
      showAlert('Aktarım reddedildi.', 'info');
    }
  };

  // Aktaran kullanıcı login olunca red bildirimi göster
  useEffect(() => {
    if (user?.name) {
      const rejectedBy = localStorage.getItem(`rejectedTransfer_${user.name}`);
      if (rejectedBy) {
        setRejectedTransferUser(rejectedBy);
        localStorage.removeItem(`rejectedTransfer_${user.name}`);
      }
    }
  }, [user?.name]);

  // State'lere barcodeStr ekle
  const [barcodeStr, setBarcodeStr] = useState<string>('');
  
  // İrsaliye özellikleri kaldırıldı
  

  return (
    <Container 
      maxWidth="lg" 
      sx={{ 
        pt: { xs: 2, md: 4 }, 
        pb: { xs: 2, md: 4 }
      }}
    >
      

      {/* Kullanıcı adı ve tarih kaldırıldı, butonlar üstte ortalanacak */}
      <Box sx={{ 
        mb: 3, 
        px: 2, 
        pt: 1, 
        pb: 2, 
        borderRadius: 2,
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        justifyContent: 'space-between',
        alignItems: isMobile ? 'flex-start' : 'center',
        gap: 1
      }}>
        <Stack
          direction={isMobile ? 'column' : 'row'}
          spacing={2}
          flexWrap="wrap"
          sx={{ mt: isMobile ? 2 : 0, width: '100%' }}
        >
          <Button
            variant="contained"
            startIcon={<EmailIcon />}
            onClick={handleEmailClick}
            disabled={inventoryItems.length === 0}
            sx={{ fontWeight: 'medium', px: 3, py: 1 }}
          >
            E-posta ile Gönder
          </Button>
          <Button
            variant="outlined"
            startIcon={<FileDownloadIcon />}
            onClick={handleExportToExcel}
            disabled={inventoryItems.length === 0}
            sx={{ fontWeight: 'medium', px: 3, py: 1 }}
          >
            Excel'e Aktar
          </Button>
          {/* İrsaliye özellikleri kaldırıldı */}

        </Stack>
      </Box>
      
      {/* Ana içerik */}
      <Stack 
        direction={{ xs: 'column', md: 'row' }} 
        spacing={isMobile ? 1 : 3}
        sx={{ px: { xs: 0, sm: 0 } }}
      >
        {/* Sol panel - Sayım araçları */}
        <Box sx={{ 
          width: { xs: '100%', md: '380px' },
          position: { md: 'sticky' },
          top: { md: '20px' },
          alignSelf: { md: 'flex-start' }
        }}>
          <Paper 
            elevation={2} 
            sx={{ 
              p: 3, 
              borderRadius: 3,
              bgcolor: 'background.paper',
              boxShadow: theme => theme.shadows[3]
            }}
          >
            <Typography 
              variant="h6" 
              fontWeight="bold"
              sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}
            >
              <TaskAltIcon fontSize="small" color="primary" /> Sayım İşlemleri
            </Typography>
            
            <Stack spacing={3}>
              {/* Numerik klavye */}
              <Box sx={{ 
                bgcolor: 'background.default',
                borderRadius: 2,
                p: 2
              }}>
                <Typography 
                  variant="subtitle2" 
                  color="text.secondary"
                  sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}
                >
                  <LocalAtmIcon fontSize="small" /> Sayılacak Miktar
                </Typography>
                <NumericKeypad 
                  value={countStr}
                  onChange={setCountStr}
                  title=""
                  onNumberEntered={handleNumberEntered}
                />
              </Box>
              <Divider sx={{ my: 2 }} />
              <Box>
                <Typography 
                  variant="subtitle2" 
                  color="text.secondary"
                  sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}
                >
                  <QrCodeIcon fontSize="small" /> Barkod Girişi
                </Typography>
                <TextField
                  label="Barkod"
                  value={barcodeStr}
                  inputRef={barcodeInputRef}
                  onChange={e => {
                    setBarcodeStr(e.target.value);
                    setBarcodeInputTime(Date.now());
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      const now = Date.now();
                      // Son yazım ile Enter arası süre kısa ve barkod uzunluğu 8+ ise otomatik ekle (okuyucu)
                      if (barcodeStr.trim().length >= 8 && now - barcodeInputTime < 200) {
                        handleBarcodeDetected(barcodeStr.trim());
                        setBarcodeStr('');
                      }
                      // Elle yazımda ekleme yapma, sadece butonla ekle
                    }
                  }}
                  fullWidth
                  variant="outlined"
                  size="small"
                  sx={{ mb: 1, borderRadius: 2 }}
                  InputProps={{ sx: { borderRadius: 2 } }}
                />
                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  sx={{ borderRadius: 2 }}
                  onClick={() => {
                    if (barcodeStr.trim()) {
                      handleBarcodeDetected(barcodeStr.trim());
                      setBarcodeStr('');
                    }
                  }}
                  disabled={!barcodeStr.trim()}
                >
                  Barkodu Ekle
                </Button>
              </Box>
            </Stack>
          </Paper>
          
          {/* Son eklenen ürün */}
          {lastAddedItem && (
            <Fade in={lastAddedItem !== null}>
              <Paper
                elevation={2}
                sx={{
                  mt: 2,
                  p: 2,
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'primary.light',
                  bgcolor: 'primary.50',
                  boxShadow: '0 4px 12px rgba(63, 81, 181, 0.08)'
                }}
              >
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Son Eklenen Ürün:
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="body1" fontWeight="medium">
                    {lastAddedItem.name}
                  </Typography>
                  <Chip 
                    label={`${lastAddedItem.count} adet`} 
                    color="primary" 
                    size="small" 
                  />
                </Box>
                <Typography variant="caption" color="text.secondary">
                  {lastAddedItem.barcode}
                </Typography>
              </Paper>
            </Fade>
          )}
        </Box>
        
        {/* Sağ panel - Sayım listesi */}
        <Box sx={{ width: { xs: '100%', md: 'calc(100% - 380px)' } }}>
          <Paper 
            elevation={2} 
            sx={{ 
              p: 3, 
              borderRadius: 3,
              boxShadow: theme => theme.shadows[3]
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box>
              <Typography variant="h6" fontWeight="bold">
                Sayım Listesi
              </Typography>
                {selectedItems.length > 0 && (
                  <Typography variant="subtitle2" color="error" sx={{ mt: 0.5 }}>
                    {selectedItems.length} ürün seçili
                  </Typography>
                )}
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Chip 
                label={`${inventoryItems.length} ürün`} 
                color="primary" 
                variant="outlined"
                size="small"
              />
                <Button
                  variant="contained"
                  color="secondary"
                  size="small"
                  onClick={handleOpenTransferDialog}
                  disabled={inventoryItems.length === 0}
                  sx={{ fontWeight: 'medium', px: 3, py: 1 }}
                >
                  Sayım Listesini Aktar
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  size="small"
                  disabled={selectedItems.length === 0}
                  onClick={handleBulkDeleteClick}
                >
                  Toplu Sil
                </Button>
              </Box>
            </Box>
            
            {/* Normal sayım tablosu */}
              <TableContainer sx={{ maxHeight: 600, overflowX: 'auto' }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell padding="checkbox">
                        <Checkbox
                          indeterminate={selectedItems.length > 0 && selectedItems.length < inventoryItems.length}
                          checked={inventoryItems.length > 0 && selectedItems.length === inventoryItems.length}
                          onChange={handleSelectAll}
                        />
                      </TableCell>
                      <TableCell>Barkod</TableCell>
                      <TableCell>Ürün Adı</TableCell>
                      <TableCell align="center" width="100">Adet</TableCell>
                      <TableCell width="150">Sayım Zamanı</TableCell>
                      <TableCell width="110" align="center">İşlemler</TableCell>
                    </TableRow>
                  </TableHead>
                <TableBody>
                  {inventoryItems.length > 0 ? (
                    inventoryItems.map((item) => (
                      <TableRow 
                        key={item.id} 
                        hover
                        sx={{ 
                          transition: 'background-color 0.2s',
                          '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.02)' },
                          borderLeft: '4px solid transparent',
                          ...(lastAddedItem && lastAddedItem.id === item.id ? {
                            borderLeft: '4px solid',
                            borderLeftColor: 'primary.main',
                            bgcolor: 'rgba(63, 81, 181, 0.04)'
                          } : {})
                        }}
                      >
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={selectedItems.includes(item.id)}
                            onChange={() => handleSelectItem(item.id)}
                          />
                        </TableCell>
                        <TableCell>{item.barcode}</TableCell>
                        <TableCell>{item.name}</TableCell>
                        <TableCell align="center">
                          <Chip 
                            label={item.count} 
                            color="primary"
                            sx={{ 
                              fontWeight: 'bold',
                              minWidth: '50px'
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {formatDate(item.timestamp)}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                            <IconButton 
                              size="small" 
                              color="primary"
                              onClick={() => handleUpdateClick(item)}
                              sx={{ 
                                border: '1px solid',
                                borderColor: 'primary.light',
                                bgcolor: 'primary.50',
                                '&:hover': { bgcolor: 'primary.100' }
                              }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton 
                              size="small" 
                              color="error"
                              onClick={() => handleDeleteClick(item.id)}
                              sx={{ 
                                border: '1px solid',
                                borderColor: 'error.light',
                                bgcolor: 'error.50',
                                '&:hover': { bgcolor: 'error.100' }
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <Box sx={{ py: 5, color: 'text.secondary' }}>
                          <Typography variant="subtitle1" fontWeight="medium">
                            Henüz stok sayımı yapılmamış
                          </Typography>
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            Barkod girerek sayıma başlayabilirsiniz
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Box>
      </Stack>
      
      {/* Silme onay diyaloğu */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCancelDelete}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">
          Sayım Kaydını Sil
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            Bu sayım kaydını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete} color="primary" variant="outlined">
            İptal
          </Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained" autoFocus>
            Sil
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Güncelleme diyaloğu */}
      <Dialog
        open={updateDialogOpen}
        onClose={handleCancelUpdate}
        aria-labelledby="update-dialog-title"
        aria-describedby="update-dialog-description"
      >
        <DialogTitle id="update-dialog-title">
          Sayım Kaydını Güncelle
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="update-dialog-description" sx={{ mb: 2 }}>
            {itemToUpdate && (
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>{itemToUpdate.name}</strong> ürününün sayım miktarını değiştirin.
              </Typography>
            )}
          </DialogContentText>
          
          <Box sx={{ width: '100%', mb: 2 }}>
            <NumericKeypad 
              value={newCount}
              onChange={setNewCount}
              title="Yeni Miktar"
              onSubmit={handleConfirmUpdate}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelUpdate} color="primary" variant="outlined">
            İptal
          </Button>
          <Button 
            onClick={handleConfirmUpdate} 
            color="primary" 
            variant="contained" 
            autoFocus
            disabled={!newCount || newCount === '0'}
          >
            Güncelle
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Email gönderme diyaloğu */}
      <Dialog
        open={emailDialogOpen}
        onClose={handleCancelEmail}
        aria-labelledby="email-dialog-title"
        aria-describedby="email-dialog-description"
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle id="email-dialog-title">
          Stok Sayım Raporunu E-posta İle Gönder
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="email-dialog-description" sx={{ mb: 3 }}>
            Stok sayım raporunuzu göndermek istediğiniz e-posta adresini girin.
          </DialogContentText>
          
          <TextField
            autoFocus
            label="E-posta Adresi"
            type="email"
            fullWidth
            variant="outlined"
            value={recipientEmail}
            onChange={(e) => setRecipientEmail(e.target.value)}
            sx={{ mb: 2 }}
          />
          
          <Box sx={{ 
            bgcolor: 'background.default',
            p: 2,
            borderRadius: 1,
            mt: 2
          }}>
            <Typography variant="body2" fontWeight="medium" sx={{ mb: 1 }}>
              Rapor Bilgileri:
            </Typography>
            <Typography variant="body2">
              • Toplam {inventoryItems.length} farklı ürün
            </Typography>
            <Typography variant="body2">
              • Toplam sayılan ürün: {inventoryItems.reduce((sum, item) => sum + item.count, 0)} adet
            </Typography>
            <Typography variant="body2">
              • Sayım tarihi: {new Date().toLocaleDateString('tr-TR')}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelEmail} color="primary" variant="outlined">
            İptal
          </Button>
          <Button 
            onClick={handleSendEmail} 
            color="primary" 
            variant="contained" 
            disabled={!recipientEmail || emailSending || !/\S+@\S+\.\S+/.test(recipientEmail)}
          >
            {emailSending ? 'Gönderiliyor...' : 'Gönder'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Toplu silme onay diyaloğu */}
      <Dialog
        open={bulkDeleteDialogOpen}
        onClose={handleCancelBulkDelete}
      >
        <DialogTitle>Seçili Kayıtları Sil</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Seçili {selectedItems.length} kaydı silmek istediğinize emin misiniz?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelBulkDelete}>İptal</Button>
          <Button onClick={handleConfirmBulkDelete} color="error">Sil</Button>
        </DialogActions>
      </Dialog>
      

      
      {/* Aktarım Teklifi Dialogu */}
      <Dialog open={pendingTransferDialogOpen} onClose={handleRejectPendingTransfer} maxWidth="xs" fullWidth fullScreen={isMobile}>
        <DialogTitle>Sayım Aktarım İsteği</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            {pendingTransfer?.from} kullanıcısı sana sayım aktarımı yapmak istiyor. Kabul edersen listedeki tüm kayıtlar sana aktarılacak.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleRejectPendingTransfer} color="primary">Aktarma</Button>
          <Button onClick={handleAcceptPendingTransfer} color="secondary" variant="contained">Aktar</Button>
        </DialogActions>
      </Dialog>
      
      {/* Aktarım Dialogu */}
      <Dialog open={transferDialogOpen} onClose={handleCloseTransferDialog} maxWidth="xs" fullWidth fullScreen={isMobile}>
        <DialogTitle>Sayım Listesini Aktar</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Sayım listenizi başka bir kullanıcıya aktarabilirsiniz. Seçilen kullanıcıdan sonra bu liste ona ait olacak.
          </DialogContentText>
          <TextField
            select
            label="Kullanıcı Seçin"
            value={selectedUser}
            onChange={e => setSelectedUser(e.target.value)}
            fullWidth
            sx={{ mb: 2 }}
          >
            {users.filter(u => u.name !== user?.name).map(u => (
              <MenuItem key={u.username} value={u.name}>{u.name}</MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseTransferDialog} color="primary">İptal</Button>
          <Button onClick={handleTransfer} color="secondary" variant="contained" disabled={!selectedUser || transferLoading}>
            {transferLoading ? 'Aktarılıyor...' : 'Aktar'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Red bildirimi için Snackbar */}
      <Snackbar 
        open={!!rejectedTransferUser} 
        autoHideDuration={4000} 
        onClose={() => setRejectedTransferUser(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={() => setRejectedTransferUser(null)} severity="warning" sx={{ width: '100%' }}>
          {rejectedTransferUser} sayım aktarımını reddetti.
        </Alert>
      </Snackbar>
      
      
      <Snackbar 
        open={alert.open} 
        autoHideDuration={4000} 
        onClose={() => setAlert({ ...alert, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={() => setAlert({ ...alert, open: false })} severity={alert.type} sx={{ width: '100%' }}>
          {alert.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Inventory; 