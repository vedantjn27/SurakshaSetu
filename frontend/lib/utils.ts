import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

// Null-safe date formatter — returns 'N/A' for missing/invalid dates
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return 'N/A';
  
  let d: Date;
  if (typeof date === 'string') {
    let dateStr = date;
    // Append 'Z' to naive date strings to ensure they are parsed as UTC
    if (!dateStr.endsWith('Z') && !dateStr.includes('+') && !dateStr.match(/-\d{2}:\d{2}$/)) {
      dateStr += 'Z';
    }
    d = new Date(dateStr);
  } else {
    d = date;
  }

  if (isNaN(d.getTime())) return 'N/A';
  return d.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}

export function getStatusBadgeColor(status: string): string {
  if (!status) return 'bg-gray-100 text-gray-800';
  const statusMap: Record<string, string> = {
    // Activity statuses from backend (case-sensitive)
    Active: 'bg-green-100 text-green-800',
    Dormant: 'bg-yellow-100 text-yellow-800',
    Closed: 'bg-red-100 text-red-800',
    Unknown: 'bg-gray-100 text-gray-800',
    // Lowercase variants
    active: 'bg-green-100 text-green-800',
    dormant: 'bg-yellow-100 text-yellow-800',
    closed: 'bg-red-100 text-red-800',
    unknown: 'bg-gray-100 text-gray-800',
    // UBID document statuses
    active_ubid: 'bg-green-100 text-green-800',
    merged: 'bg-blue-100 text-blue-800',
    superseded: 'bg-gray-100 text-gray-800',
    // Job/queue statuses
    pending: 'bg-yellow-100 text-yellow-800',
    failed: 'bg-red-100 text-red-800',
    completed: 'bg-blue-100 text-blue-800',
    processing: 'bg-purple-100 text-purple-800',
  };
  return statusMap[status] || 'bg-gray-100 text-gray-800';
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
