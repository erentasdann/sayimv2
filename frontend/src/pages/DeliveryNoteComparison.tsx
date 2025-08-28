import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Alert,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  GetApp as DownloadIcon,
  Compare as CompareIcon,
  Description as FileIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import deliveryNoteService from '../services/deliveryNoteService';

// Styled components
const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

const UploadArea = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  textAlign: 'center',
  borderStyle: 'dashed',
  borderWidth: 2,
  borderColor: theme.palette.divider,
  backgroundColor: theme.palette.grey[50],
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  '&:hover': {
    borderColor: theme.palette.primary.main,
    backgroundColor: theme.palette.primary.light + '10',
  },
}));

// Types
interface DeliveryProduct {
  id: string;
  productCode: string;
  productName: string;
  expectedQuantity: number;
  countedQuantity: number;
  difference: number;
  status: 'match' | 'shortage' | 'excess';
}

interface DeliveryNote {
  deliveryNumber: string;
  date: string;
  supplier: string;
  products: DeliveryProduct[];
}

const DeliveryNoteComparison: React.FC = () => {
  const [deliveryNote, setDeliveryNote] = useState<DeliveryNote | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      const data = await deliveryNoteService.uploadDeliveryNote(file);
      setDeliveryNote(data);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Bilinmeyen hata');
    } finally {
      setIsUploading(false);
    }
  };

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (!deliveryNote) return;

    const updatedDeliveryNote = deliveryNoteService.updateProductQuantity(
      deliveryNote, 
      productId, 
      newQuantity
    );
    setDeliveryNote(updatedDeliveryNote);
  };

  const generatePDF = () => {
    if (!deliveryNote) return;

    // PDF oluştur
    const doc = new jsPDF();
    
    // Başlık
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('İrsaliye Karşılaştırma Raporu', 20, 20);
    
    // İrsaliye bilgileri
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`İrsaliye No: ${deliveryNote.deliveryNumber}`, 20, 40);
    doc.text(`Tarih: ${deliveryNote.date}`, 20, 50);
    doc.text(`Tedarikçi: ${deliveryNote.supplier}`, 20, 60);
    
    // Özet bilgiler
    const report = deliveryNoteService.generateComparisonReport(deliveryNote);
    doc.text(`Toplam Ürün: ${report.totalProducts}`, 120, 40);
    doc.text(`Eşleşen: ${report.matchingProducts}`, 120, 50);
    doc.text(`Eksik: ${report.shortageProducts} (${report.shortageCount} adet)`, 120, 60);
    doc.text(`Fazla: ${report.excessProducts} (${report.excessCount} adet)`, 120, 70);
    
    // Tablo verileri hazırla
    const tableData = deliveryNote.products.map(product => [
      product.productCode,
      product.productName,
      product.expectedQuantity.toString(),
      product.countedQuantity.toString(),
      product.difference.toString(),
      product.status === 'match' ? 'Eşleşiyor' : 
      product.status === 'shortage' ? 'Eksik' : 'Fazla'
    ]);
    
    // Tablo ekle
    (doc as any).autoTable({
      head: [['Ürün Kodu', 'Ürün Adı', 'Beklenen', 'Sayılan', 'Fark', 'Durum']],
      body: tableData,
      startY: 85,
      styles: {
        fontSize: 8,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [63, 81, 181],
        textColor: 255,
        fontStyle: 'bold',
      },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 60 },
        2: { cellWidth: 20, halign: 'center' },
        3: { cellWidth: 20, halign: 'center' },
        4: { cellWidth: 15, halign: 'center' },
        5: { cellWidth: 25, halign: 'center' },
      },
      didParseCell: function(data: any) {
        if (data.section === 'body') {
          const status = data.raw[5];
          if (status === 'Eksik') {
            data.cell.styles.textColor = [244, 67, 54]; // Kırmızı
          } else if (status === 'Fazla') {
            data.cell.styles.textColor = [255, 152, 0]; // Turuncu
          } else if (status === 'Eşleşiyor') {
            data.cell.styles.textColor = [76, 175, 80]; // Yeşil
          }
        }
      }
    });
    
    // PDF'i indir
    doc.save(`irsaliye-karsilastirma-${deliveryNote.deliveryNumber}.pdf`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'match': return 'success';
      case 'shortage': return 'error';
      case 'excess': return 'warning';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'match': return 'Eşleşiyor';
      case 'shortage': return 'Eksik';
      case 'excess': return 'Fazla';
      default: return '';
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          İrsaliye Karşılaştırma
        </Typography>
        <Typography variant="body1" color="text.secondary">
          İrsaliye dosyasını yükleyerek ürün sayımı karşılaştırması yapın
        </Typography>
      </Box>

      {!deliveryNote ? (
        <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
          <Box sx={{ flex: 2 }}>
            <UploadArea>
              <FileIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                İrsaliye Dosyasını Yükleyin
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                PDF veya Excel (.xlsx) formatında irsaliye dosyanızı buraya sürükleyin veya seçin
              </Typography>
              <Button
                component="label"
                variant="contained"
                startIcon={<UploadIcon />}
                disabled={isUploading}
              >
                {isUploading ? 'Yükleniyor...' : 'Dosya Seç'}
                <VisuallyHiddenInput
                  type="file"
                  accept=".pdf,.xlsx,.xls"
                  onChange={handleFileUpload}
                />
              </Button>
            </UploadArea>
            {uploadError && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {uploadError}
              </Alert>
            )}
          </Box>
          <Box sx={{ flex: 1 }}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Dosya Formatı
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Desteklenen dosya formatları:
              </Typography>
              <Box component="ul" sx={{ pl: 2, m: 0, mb: 2 }}>
                <li><strong>PDF:</strong> Standart irsaliye PDF'leri</li>
                <li><strong>Excel:</strong> .xlsx, .xls formatları</li>
              </Box>
              <Typography variant="body2" color="text.secondary" paragraph>
                Excel dosyaları için gerekli sütunlar:
              </Typography>
              <Box component="ul" sx={{ pl: 2, m: 0 }}>
                <li>Ürün Kodu</li>
                <li>Ürün Adı</li>
                <li>Miktar</li>
              </Box>
            </Paper>
          </Box>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Delivery Note Info */}
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                İrsaliye Bilgileri
              </Typography>
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={generatePDF}
              >
                PDF İndir
              </Button>
            </Box>
            <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  İrsaliye No
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {deliveryNote.deliveryNumber}
                </Typography>
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Tarih
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {deliveryNote.date}
                </Typography>
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Tedarikçi
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {deliveryNote.supplier}
                </Typography>
              </Box>
            </Box>
          </Paper>

          {/* Products Comparison Table */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Ürün Karşılaştırması
            </Typography>
            <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Ürün Kodu</TableCell>
                      <TableCell>Ürün Adı</TableCell>
                      <TableCell align="center">Beklenen Adet</TableCell>
                      <TableCell align="center">Sayılan Adet</TableCell>
                      <TableCell align="center">Fark</TableCell>
                      <TableCell align="center">Durum</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {deliveryNote.products.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>{product.productCode}</TableCell>
                        <TableCell>{product.productName}</TableCell>
                        <TableCell align="center">{product.expectedQuantity}</TableCell>
                        <TableCell align="center">
                          <TextField
                            type="number"
                            size="small"
                            value={product.countedQuantity}
                            onChange={(e) => handleQuantityChange(product.id, parseInt(e.target.value) || 0)}
                            sx={{ width: 80 }}
                            inputProps={{ min: 0 }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Typography
                            color={product.difference === 0 ? 'text.secondary' : product.difference > 0 ? 'warning.main' : 'error.main'}
                            fontWeight="medium"
                          >
                            {product.difference > 0 ? '+' : ''}{product.difference}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={getStatusText(product.status)}
                            color={getStatusColor(product.status) as any}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
          </Paper>
        </Box>
      )}
    </Container>
  );
};

export default DeliveryNoteComparison;
