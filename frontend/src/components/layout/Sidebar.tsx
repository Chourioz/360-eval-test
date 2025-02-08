import React from 'react';
import { useNavigate, useRouter } from '@tanstack/react-router';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Toolbar,
  Divider,
} from '@mui/material';
import {
  Dashboard,
  Assessment,
  Group,
  Person,
  Settings,
  Feedback,
  Assignment,
} from '@mui/icons-material';
import { useAuth } from '@/hooks/useAuth';

interface SidebarProps {
  open: boolean;
  width: number;
}

interface MenuItem {
  text: string;
  icon: React.ReactNode;
  path: string;
  roles: Array<'admin' | 'manager' | 'employee'>;
}

const menuItems: MenuItem[] = [
  {
    text: 'Dashboard',
    icon: <Dashboard />,
    path: '/',
    roles: ['admin', 'manager', 'employee'],
  },
  {
    text: 'Mi Perfil',
    icon: <Person />,
    path: '/profile',
    roles: ['admin', 'manager', 'employee'],
  },
  {
    text: 'Evaluaciones',
    icon: <Assessment />,
    path: '/evaluations',
    roles: ['admin', 'manager'],
  },
  {
    text: 'Mis Evaluaciones',
    icon: <Assignment />,
    path: '/my-evaluations',
    roles: ['employee'],
  },
  {
    text: 'Feedback Pendiente',
    icon: <Feedback />,
    path: '/pending-feedback',
    roles: ['admin', 'manager', 'employee'],
  },
  {
    text: 'Empleados',
    icon: <Group />,
    path: '/employees',
    roles: ['admin', 'manager'],
  },
  {
    text: 'Configuración',
    icon: <Settings />,
    path: '/settings',
    roles: ['admin'],
  },
];

const Sidebar: React.FC<SidebarProps> = ({ open, width }) => {
  const navigate = useNavigate();
  const router = useRouter();
  const { user } = useAuth();

  const filteredMenuItems = React.useMemo(() => {
    if (!user) return [];
    return menuItems.filter((item) => item.roles.includes(user.role));
  }, [user]);

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: open ? width : 0,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width,
          boxSizing: 'border-box',
          transform: open ? 'none' : 'translateX(-100%)',
          transition: (theme) =>
            theme.transitions.create('transform', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
        },
      }}
    >
      <Toolbar />
      <List sx={{ mt: 2 }}>
        {filteredMenuItems.map((item) => (
          <React.Fragment key={item.path}>
            <ListItem disablePadding>
              <ListItemButton
                selected={router.state.location.pathname === item.path}
                onClick={() => navigate({ to: item.path })}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
            {item.text === 'Dashboard' && <Divider sx={{ my: 1 }} />}
          </React.Fragment>
        ))}
      </List>
    </Drawer>
  );
};

export default Sidebar; 