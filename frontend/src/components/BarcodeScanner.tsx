import React, { useState, useRef, useImperativeHandle, forwardRef } from 'react';
import { 
  Button, 
  Box, 
  TextField, 
  FormControl, 
  InputAdornment,
  IconButton
} from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
import SearchIcon from '@mui/icons-material/Search';

interface BarcodeScannerProps {
  onBarcodeDetected: (barcode: string) => void;
}

export interface BarcodeScannerRef {
  focus: () => void;
}

const BarcodeScanner: React.ForwardRefRenderFunction<BarcodeScannerRef, BarcodeScannerProps> = ({ onBarcodeDetected }, ref) => {
  const [manualBarcode, setManualBarcode] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Expose focus method to parent component
  useImperativeHandle(ref, () => ({
    focus: () => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  }));
  
  // Manuel barkod gönderme
  const handleManualSubmit = () => {
    if (manualBarcode) {
      onBarcodeDetected(manualBarcode);
      setManualBarcode('');
    }
  };
  
  return (
    <Box>
      <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
        <TextField
          inputRef={inputRef}
          label="Barkod"
          value={manualBarcode}
          onChange={(e) => setManualBarcode(e.target.value)}
          placeholder="Barkodu elle girin"
          variant="outlined"
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" color="action" />
              </InputAdornment>
            ),
            endAdornment: manualBarcode ? (
              <InputAdornment position="end">
                <IconButton
                  onClick={() => setManualBarcode('')}
                  edge="end"
                  size="small"
                >
                  <ClearIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ) : null,
            sx: { borderRadius: 2 }
          }}
          onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()}
        />
      </FormControl>
      <Button 
        variant="contained" 
        color="primary" 
        onClick={handleManualSubmit}
        fullWidth
        size="medium"
        sx={{ mb: 2, borderRadius: 2 }}
        disabled={!manualBarcode}
      >
        Barkodu Ekle
      </Button>
    </Box>
  );
};

export default forwardRef(BarcodeScanner); 