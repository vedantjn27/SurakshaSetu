import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}

export function getStatusBadgeColor(status: string): string {
  const statusMap: Record<string, string> = {
    active: 'bg-green-100 text-green-800',
    dormant: 'bg-gray-100 text-gray-800',
    pending: 'bg-yellow-100 text-yellow-800',
    failed: 'bg-red-100 text-red-800',
    completed: 'bg-blue-100 text-blue-800',
  };
  return statusMap[status.toLowerCase()] || 'bg-gray-100 text-gray-800';
}

export function getRoleBadgeColor(role: string): string {
  const roleMap: Record<string, string> = {
    admin: 'bg-purple-100 text-purple-800',
    reviewer: 'bg-blue-100 text-blue-800',
    analyst: 'bg-green-100 text-green-800',
  };
  return roleMap[role.toLowerCase()] || 'bg-gray-100 text-gray-800';
}

export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('authToken');
}

export function getStoredUser() {
  if (typeof window === 'undefined') return null;
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
}

export function hasRole(requiredRole: string): boolean {
  const user = getStoredUser();
  if (!user) return false;
  
  const roleHierarchy: Record<string, number> = {
    admin: 3,
    reviewer: 2,
    analyst: 1,
  };
  
  return (roleHierarchy[user.role] || 0) >= (roleHierarchy[requiredRole] || 0);
}
