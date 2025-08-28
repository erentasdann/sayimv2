import React, { useState, useEffect } from 'react';
import { 
  TextField,
  Button,
  Typography,
  Paper,
  Box,
  Container,
  Avatar,
  CssBaseline,
  Alert,
  Snackbar,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import LockIcon from '@mui/icons-material/Lock';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showError, setShowError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Kullanıcı adı ve şifre girin');
      setShowError(true);
      return;
    }
    try {
      const success = await login(username, password);
      if (success) {
        navigate('/inventory');
      } else {
        setError('Kullanıcı adı veya şifre hatalı.');
        setShowError(true);
      }
    } catch (err) {
      setError('Giriş yapılırken bir hata oluştu');
      setShowError(true);
    }
  };

  const handleCloseError = () => {
    setShowError(false);
  };

  return (
    <Container 
      component="main"
      maxWidth="sm"
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <CssBaseline />
      <Card 
        sx={{ 
          width: '100%', 
          borderRadius: 4,
          boxShadow: '0 8px 20px rgba(0,0,0,0.1)',
          overflow: 'hidden',
          maxWidth: 420
        }}
      >
        <Box
          sx={{
            bgcolor: 'primary.main',
            py: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            color: 'white',
          }}
        >
          <Avatar 
            sx={{ 
              bgcolor: 'white', 
              color: 'primary.main',
              width: 80,
              height: 80,
              mb: 2,
              boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
            }}
          >
            <LockIcon fontSize="large" />
          </Avatar>
          <Typography component="h1" variant="h4" fontWeight="bold">
            Giriş Yap
          </Typography>
          <Typography variant="body1" sx={{ mt: 1, opacity: 0.8 }}>
            Lütfen kullanıcı adı ve şifrenizi girin
          </Typography>
        </Box>
        <CardContent sx={{ p: 4 }}>
          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField
              margin="normal"
              required
              fullWidth
              id="username"
              label="Kullanıcı Adı"
              name="username"
              autoComplete="username"
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              variant="outlined"
              sx={{ mb: 2 }}
              InputProps={{
                sx: { borderRadius: 2, fontSize: '1.1rem' }
              }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Şifre"
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              variant="outlined"
              sx={{ mb: 1 }}
              InputProps={{
                sx: { borderRadius: 2, fontSize: '1.1rem' },
                endAdornment: (
                  <Button onClick={() => setShowPassword((v) => !v)} tabIndex={-1} sx={{ minWidth: 0, p: 0.5 }}>
                    {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                  </Button>
                )
              }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              sx={{ 
                py: 1.5, 
                mb: 1, 
                borderRadius: 2,
                fontSize: '1.1rem',
                fontWeight: 600
              }}
              endIcon={<ArrowForwardIcon />}
            >
              Giriş Yap
            </Button>
          </Box>
        </CardContent>
      </Card>
      <Snackbar open={showError} autoHideDuration={6000} onClose={handleCloseError}>
        <Alert onClose={handleCloseError} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Login; 