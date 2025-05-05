import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Paper, 
  Box, 
  Button, 
  Stack,
  TextField,
  Table,
  TableContainer,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Divider,
  Alert,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import { format } from 'date-fns';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import EmailIcon from '@mui/icons-material/Email';
import * as inventoryService from '../services/inventoryService';
import { InventoryItem } from '../types';

const Reports: React.FC = () => {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<InventoryItem[]>([]);
  const [emailTo, setEmailTo] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('date_desc');
  const [alert, setAlert] = useState<{
    open: boolean;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    type: 'info'
  });

  // Sayfa yüklendiğinde verileri getir
  useEffect(() => {
    loadInventoryData();
  }, []);

  // Filtreleme veya sıralama her değiştiğinde verileri güncelle
  useEffect(() => {
    filterAndSortItems();
  }, [searchTerm, sortBy, inventoryItems]);

  // Stok verilerini yükle
  const loadInventoryData = async () => {
    try {
      const items = await inventoryService.getAllInventoryItems();
      setInventoryItems(items);
    } catch (error) {
      console.error('Stok verileri yüklenirken hata oluştu:', error);
      showAlert('Stok verileri yüklenirken hata oluştu', 'error');
    }
  };

  // Öğeleri filtrele ve sırala
  const filterAndSortItems = () => {
    // Önce filtrele
    let filtered = inventoryItems;
    if (searchTerm) {
      filtered = inventoryItems.filter(
        (item) =>
          item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.barcode.includes(searchTerm) ||
          item.countedBy.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sonra sırala
    switch (sortBy) {
      case 'name_asc':
        filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name_desc':
        filtered = [...filtered].sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'count_asc':
        filtered = [...filtered].sort((a, b) => a.count - b.count);
        break;
      case 'count_desc':
        filtered = [...filtered].sort((a, b) => b.count - a.count);
        break;
      case 'date_asc':
        filtered = [...filtered].sort((a, b) => (new Date(a.timestamp)).getTime() - (new Date(b.timestamp)).getTime());
        break;
      case 'date_desc':
      default:
        filtered = [...filtered].sort((a, b) => (new Date(b.timestamp)).getTime() - (new Date(a.timestamp)).getTime());
        break;
    }

    setFilteredItems(filtered);
  };

  // Bildirim gösterme
  const showAlert = (message: string, type: 'success' | 'error' | 'info' | 'warning') => {
    setAlert({
      open: true,
      message,
      type
    });
  };

  // Bildirimi kapat
  const handleCloseAlert = () => {
    setAlert({
      ...alert,
      open: false
    });
  };

  // Excel'e aktar
  const handleExportToExcel = () => {
    if (filteredItems.length === 0) {
      showAlert('Dışa aktarılacak veri bulunamadı', 'warning');
      return;
    }
    
    try {
      inventoryService.exportToExcel(filteredItems);
      showAlert('Stok sayım raporu başarıyla indirildi', 'success');
    } catch (error) {
      console.error('Excel dışa aktarımı sırasında hata:', error);
      showAlert('Excel dışa aktarımı sırasında hata oluştu', 'error');
    }
  };

  // E-posta ile gönder
  const handleSendByEmail = async () => {
    if (!emailTo) {
      showAlert('Lütfen bir e-posta adresi girin', 'warning');
      return;
    }
    
    if (filteredItems.length === 0) {
      showAlert('Gönderilecek veri bulunamadı', 'warning');
      return;
    }
    
    try {
      const success = await inventoryService.sendReportByEmail(emailTo, filteredItems);
      if (success) {
        showAlert(`Rapor ${emailTo} adresine başarıyla gönderildi`, 'success');
        setEmailTo('');
      } else {
        showAlert('E-posta gönderilirken bir hata oluştu', 'error');
      }
    } catch (error) {
      console.error('E-posta gönderilirken hata:', error);
      showAlert('E-posta gönderilirken bir hata oluştu', 'error');
    }
  };

  // Sıralama değişikliği
  const handleSortChange = (event: SelectChangeEvent) => {
    setSortBy(event.target.value);
  };

  // Tarihi formatla
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'dd.MM.yyyy HH:mm:ss');
    } catch (error) {
      return dateString;
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Stok Sayım Raporları
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Stok sayım verilerini görüntüleyin, filtreyin ve raporlayın
        </Typography>
      </Box>

      <Paper elevation={3} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>
          Filtreleme ve Sıralama
        </Typography>
        
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
          <TextField
            label="Ara"
            placeholder="Ürün adı, barkod veya sayan kişi"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            fullWidth
          />
          
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel id="sort-select-label">Sıralama</InputLabel>
            <Select
              labelId="sort-select-label"
              id="sort-select"
              value={sortBy}
              label="Sıralama"
              onChange={handleSortChange}
            >
              <MenuItem value="date_desc">Tarih (Yeni-Eski)</MenuItem>
              <MenuItem value="date_asc">Tarih (Eski-Yeni)</MenuItem>
              <MenuItem value="name_asc">Ürün Adı (A-Z)</MenuItem>
              <MenuItem value="name_desc">Ürün Adı (Z-A)</MenuItem>
              <MenuItem value="count_desc">Miktar (Çok-Az)</MenuItem>
              <MenuItem value="count_asc">Miktar (Az-Çok)</MenuItem>
            </Select>
          </FormControl>
        </Stack>
        
        <Typography variant="subtitle2" gutterBottom>
          Toplam {filteredItems.length} ürün bulundu
        </Typography>
      </Paper>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
        <Box sx={{ width: { xs: '100%', md: '70%' } }}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>
              Sayım Listesi
            </Typography>
            
            <TableContainer sx={{ maxHeight: 600 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Barkod</TableCell>
                    <TableCell>Ürün Adı</TableCell>
                    <TableCell align="center">Adet</TableCell>
                    <TableCell>Sayım Tarihi</TableCell>
                    <TableCell>Sayan</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredItems.length > 0 ? (
                    filteredItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.barcode}</TableCell>
                        <TableCell>{item.name}</TableCell>
                        <TableCell align="center">{item.count}</TableCell>
                        <TableCell>{formatDate(item.timestamp)}</TableCell>
                        <TableCell>{item.countedBy}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        {searchTerm 
                          ? 'Arama kriterlerine uygun veri bulunamadı' 
                          : 'Henüz stok sayımı yapılmamış'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Box>
        
        <Box sx={{ width: { xs: '100%', md: '30%' } }}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>
              Rapor İşlemleri
            </Typography>
            
            <Stack spacing={2}>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                startIcon={<FileDownloadIcon />}
                onClick={handleExportToExcel}
                disabled={filteredItems.length === 0}
              >
                Excel Olarak İndir
              </Button>
              
              <Divider sx={{ my: 1 }} />
              
              <Typography variant="subtitle2" gutterBottom>
                E-posta ile Gönder
              </Typography>
              
              <TextField
                label="E-posta Adresi"
                type="email"
                value={emailTo}
                onChange={(e) => setEmailTo(e.target.value)}
                fullWidth
                sx={{ mb: 1 }}
              />
              
              <Button
                variant="contained"
                color="secondary"
                fullWidth
                startIcon={<EmailIcon />}
                onClick={handleSendByEmail}
                disabled={filteredItems.length === 0}
              >
                E-posta Gönder
              </Button>
            </Stack>
          </Paper>

          <Paper elevation={3} sx={{ p: 3, mt: 3, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>
              İstatistikler
            </Typography>
            
            <Stack spacing={2}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Toplam Sayılan Ürün Sayısı
                </Typography>
                <Typography variant="h5">
                  {filteredItems.length}
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Toplam Ürün Miktarı
                </Typography>
                <Typography variant="h5">
                  {filteredItems.reduce((total, item) => total + item.count, 0)}
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Son Sayım Tarihi
                </Typography>
                <Typography variant="h6">
                  {filteredItems.length > 0 
                    ? formatDate(filteredItems.sort((a, b) => 
                        (new Date(b.timestamp)).getTime() - (new Date(a.timestamp)).getTime())[0].timestamp)
                    : '-'}
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Box>
      </Stack>
      
      <Snackbar 
        open={alert.open} 
        autoHideDuration={6000} 
        onClose={handleCloseAlert}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseAlert} severity={alert.type} sx={{ width: '100%' }}>
          {alert.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Reports; 