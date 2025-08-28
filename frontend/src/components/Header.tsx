import React, { useState, useEffect } from 'react';
import { 
  AppBar, 
  Box, 
  Toolbar, 
  Typography, 
  Button, 
  Container,
  Avatar,
  IconButton,
  Menu,
  MenuItem
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };



  return (
    <AppBar position="static" elevation={0} sx={{ bgcolor: 'white', color: 'text.primary', borderBottom: '1px solid #eaeaea' }}>
      <Container maxWidth="lg">
        <Toolbar sx={{ px: { xs: 0 } }}>
          <Box
            component="div"
            sx={{ 
              display: 'flex', 
              alignItems: 'center',
              color: 'primary.main'
            }}
          >
            <img src="/logo192.png" alt="Logo" style={{ height: 110 , width: 240 }} />
          </Box>

          <Box sx={{ flexGrow: 1 }} />



          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {user && (
              <Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
                <Avatar
                  sx={{
                    width: 36,
                    height: 36,
                    bgcolor: 'primary.main',
                    fontSize: '1rem',
                    fontWeight: 'bold',
                  }}
                >
                  {user.name.charAt(0).toUpperCase()}
                </Avatar>
                <Typography 
                  sx={{ 
                    ml: 1.5, 
                    fontWeight: 'medium',
                    display: { xs: 'none', sm: 'block' }
                  }}
                >
                  {user.name}
                </Typography>
              </Box>
            )}
            <IconButton 
              color="primary" 
              onClick={handleLogout}
              size="small"
              sx={{ 
                border: '1px solid',
                borderColor: 'divider',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                ml: 1
              }}
              aria-label="Çıkış"
            >
              <LogoutIcon fontSize="small" />
            </IconButton>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Header; 