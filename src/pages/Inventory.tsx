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
  TextField
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import BarcodeScanner, { BarcodeScannerRef } from '../components/BarcodeScanner';
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

const Inventory: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useAuth();
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

  // Barkod scanner referansı
  const barcodeScannerRef = useRef<BarcodeScannerRef>(null);

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
      // Son eklenen öğeleri üste getir
      const sortedItems = items.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      setInventoryItems(sortedItems);
    } catch (error) {
      console.error('Stok verileri yüklenirken hata oluştu:', error);
      showAlert('Stok verileri yüklenirken hata oluştu', 'error');
    }
  };
  
  // Miktar girildiğinde barkod tarayıcıya odaklan
  const handleNumberEntered = () => {
    // Sayıdan 300ms sonra barkod girişine odaklan (animasyon için küçük bir gecikme)
    setTimeout(() => {
      if (barcodeScannerRef.current) {
        barcodeScannerRef.current.focus();
      }
    }, 300);
  };
  
  // Barkod tespit edildiğinde
  const handleBarcodeDetected = async (barcode: string) => {
    if (!barcode || !user) return;
    
    try {
      const count = parseInt(countStr) || 1;
      const result = await inventoryService.addOrUpdateInventoryItem(
        barcode,
        count,
        user.name
      );
      
      // Verileri yenile
      loadInventoryData();
      // Son eklenen öğeyi kaydet
      setLastAddedItem(result);
      
      // Başarı mesajını içeriğe göre ayarla
      const isNewItem = result.count === count;
      const message = isNewItem
        ? `${result.name} başarıyla sayıldı (${count} adet)`
        : `${result.name} sayımı güncellendi (${result.count} adet, son eklenen: ${count} adet)`;
      
      // Başarı mesajı göster
      showAlert(message, 'success');
      
      // Sayıdan sonra sıfırla
      setCountStr('1');
      
      // Sayım işleminden sonra tekrar barkod alanına odaklan
      setTimeout(() => {
        if (barcodeScannerRef.current) {
          barcodeScannerRef.current.focus();
        }
      }, 300);
      
      // 5 saniye sonra son eklenen öğe bilgisini temizle
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
  
  return (
    <Container 
      maxWidth="lg" 
      sx={{ 
        pt: { xs: 2, md: 4 }, 
        pb: { xs: 2, md: 4 }
      }}
    >
      {/* Sayfa başlığı */}
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
        <Box>
          <Typography 
            variant="h4" 
            component="h1" 
            fontWeight="bold" 
            color="primary"
            sx={{ mb: 0.5 }}
          >
            Stok Sayım
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            {user?.name} | {new Date().toLocaleDateString('tr-TR')}
          </Typography>
        </Box>
        
        <Box sx={{ 
          mt: isMobile ? 2 : 0,
          display: 'flex',
          gap: 2,
          flexWrap: 'wrap'
        }}>
          <Button
            variant="outlined"
            startIcon={<EmailIcon />}
            onClick={handleEmailClick}
            disabled={inventoryItems.length === 0}
            sx={{ fontWeight: 'medium', px: 3, py: 1 }}
          >
            E-posta İle Gönder
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
        </Box>
      </Box>
      
      {/* Ana içerik */}
      <Stack 
        direction={{ xs: 'column', md: 'row' }} 
        spacing={3}
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
              
              <Divider />
              
              {/* Barkod girişi */}
              <Box>
                <Typography 
                  variant="subtitle2" 
                  color="text.secondary"
                  sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}
                >
                  <QrCodeIcon fontSize="small" /> Barkod Girişi
                </Typography>
                <BarcodeScanner 
                  ref={barcodeScannerRef}
                  onBarcodeDetected={handleBarcodeDetected} 
                />
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
              <Typography variant="h6" fontWeight="bold">
                Sayım Listesi
              </Typography>
              <Chip 
                label={`${inventoryItems.length} ürün`} 
                color="primary" 
                variant="outlined"
                size="small"
              />
            </Box>
            
            <TableContainer sx={{ maxHeight: 600, overflowX: 'auto' }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Barkod/Ürün</TableCell>
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
                        <TableCell>
                          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                            <Typography variant="body2" fontWeight="medium">
                              {item.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {item.barcode}
                            </Typography>
                          </Box>
                        </TableCell>
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
                      <TableCell colSpan={4} align="center">
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