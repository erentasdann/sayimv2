import React from 'react';
import { Box, Button, Stack, Paper, Typography, Grid as MuiGrid } from '@mui/material';
import { styled } from '@mui/material/styles';
import BackspaceIcon from '@mui/icons-material/Backspace';
import DoneIcon from '@mui/icons-material/Done';

// Grid bileşenini özelleştiriyoruz
const Grid = styled(MuiGrid)({});

interface NumericKeypadProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  onNumberEntered?: () => void;
  maxLength?: number;
  title?: string;
}

const NumericKeypad: React.FC<NumericKeypadProps> = ({
  value,
  onChange,
  onSubmit,
  onNumberEntered,
  maxLength = 6,
  title = 'Adet'
}) => {
  // Tuşa basıldığında
  const handleNumPress = (num: string) => {
    if (value.length < maxLength) {
      onChange(value + num);
      
      // Eğer bu özellik tanımlı ise, sayı girildiğinde bildir
      if (onNumberEntered) {
        onNumberEntered();
      }
    }
  };

  // Sil tuşuna basıldığında
  const handleBackspace = () => {
    onChange(value.slice(0, -1));
  };

  // Temizle
  const handleClear = () => {
    onChange('');
  };

  // Onay tuşuna basıldığında
  const handleSubmit = () => {
    if (onSubmit && value) {
      onSubmit();
    }
  };

  // Tuş düzeni
  const keys = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['C', '0', '<']
  ];

  return (
    <Paper 
      elevation={0} 
      sx={{ 
        p: 2, 
        borderRadius: 3,
        bgcolor: 'background.paper' 
      }}
    >
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="subtitle1" fontWeight="medium">{title}</Typography>
        <Paper
          elevation={0}
          sx={{
            p: 1.5,
            borderRadius: 2,
            bgcolor: 'background.default',
            width: '100%',
            ml: 2,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <Typography 
            variant="h5" 
            align="center" 
            fontWeight="bold"
            sx={{ 
              minHeight: '36px',
              color: value ? 'text.primary' : 'text.disabled'
            }}
          >
            {value || '0'}
          </Typography>
        </Paper>
      </Box>

      <Stack spacing={1}>
        {keys.map((row, rowIndex) => (
          <Stack direction="row" spacing={1} key={`row-${rowIndex}`}>
            {row.map((key) => (
              <Box key={`key-${key}`} sx={{ flexGrow: 1, width: '33.33%' }}>
                <Button
                  variant="contained"
                  color={key === 'C' ? 'error' : key === '<' ? 'info' : 'primary'}
                  fullWidth
                  sx={{
                    py: 1.5,
                    borderRadius: 2,
                    fontSize: '1.1rem',
                    fontWeight: 'bold'
                  }}
                  onClick={() => {
                    if (key === '<') {
                      handleBackspace();
                    } else if (key === 'C') {
                      handleClear();
                    } else {
                      handleNumPress(key);
                    }
                  }}
                >
                  {key === '<' ? <BackspaceIcon /> : key}
                </Button>
              </Box>
            ))}
          </Stack>
        ))}

        <Box sx={{ mt: 1 }}>
          <Button
            variant="contained"
            color="success"
            fullWidth
            sx={{
              py: 1.5,
              borderRadius: 2,
              fontSize: '1.1rem',
              fontWeight: 'bold'
            }}
            onClick={handleSubmit}
            disabled={!value}
            endIcon={<DoneIcon />}
          >
            Onayla
          </Button>
        </Box>
      </Stack>
    </Paper>
  );
};

export default NumericKeypad; 