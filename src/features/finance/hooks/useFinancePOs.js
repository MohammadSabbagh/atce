// features/finance/hooks/useFinancePOs.js
// Mock data hook — Supabase Realtime subscription slot is ready for Phase 4.
// Replace MOCK_POS and the useEffect stub with the real subscription when auth is live.

import { useState, useEffect, useCallback } from 'react';

const DEPARTMENTS = ['Operations', 'Marketing', 'Engineering', 'HR', 'Sales', 'Legal', 'Finance'];

const MOCK_POS = [
  {
    id: '1', po_number: 'PO-001', title: 'Office Supplies Q2',
    department: 'Operations', status: 'approved', total: 1240.00,
    requires_ceo: false, date: '2026-03-01',
    creator: { full_name: 'Alaa Mansour' },
    tags: [{ tag: 'monthly' }, { tag: 'Q2' }],
    created_at: '2026-03-01T08:00:00Z', approved_at: '2026-03-02T10:30:00Z',
  },
  {
    id: '2', po_number: 'PO-002', title: 'Server Infrastructure Upgrade',
    department: 'Engineering', status: 'approved', total: 18500.00,
    requires_ceo: true, date: '2026-03-05',
    creator: { full_name: 'Alaa Mansour' },
    tags: [{ tag: 'urgent' }, { tag: 'infrastructure' }],
    created_at: '2026-03-05T09:15:00Z', approved_at: '2026-03-06T14:00:00Z',
  },
  {
    id: '3', po_number: 'PO-003', title: 'Social Media Ad Campaign',
    department: 'Marketing', status: 'pending', total: 4300.00,
    requires_ceo: false, date: '2026-03-10',
    creator: { full_name: 'Layla Hassan' },
    tags: [{ tag: 'campaign' }, { tag: 'Q2' }],
    created_at: '2026-03-10T11:00:00Z', approved_at: null,
  },
  {
    id: '4', po_number: 'PO-004', title: 'Legal Consultation Fees',
    department: 'Legal', status: 'approved', total: 7200.00,
    requires_ceo: true, date: '2026-03-12',
    creator: { full_name: 'Alaa Mansour' },
    tags: [{ tag: 'retainer' }],
    created_at: '2026-03-12T10:00:00Z', approved_at: '2026-03-13T09:00:00Z',
  },
  {
    id: '5', po_number: 'PO-005', title: 'Recruitment Platform Subscription',
    department: 'HR', status: 'rejected', total: 960.00,
    requires_ceo: false, date: '2026-03-14',
    creator: { full_name: 'Alaa Mansour' },
    tags: [{ tag: 'saas' }, { tag: 'monthly' }],
    created_at: '2026-03-14T13:00:00Z', approved_at: null,
  },
  {
    id: '6', po_number: 'PO-006', title: 'Sales Team Laptops',
    department: 'Sales', status: 'pending', total: 11200.00,
    requires_ceo: true, date: '2026-03-18',
    creator: { full_name: 'Layla Hassan' },
    tags: [{ tag: 'hardware' }, { tag: 'urgent' }],
    created_at: '2026-03-18T08:30:00Z', approved_at: null,
  },
  {
    id: '7', po_number: 'PO-007', title: 'Finance Software License',
    department: 'Finance', status: 'approved', total: 3600.00,
    requires_ceo: false, date: '2026-03-20',
    creator: { full_name: 'Alaa Mansour' },
    tags: [{ tag: 'saas' }, { tag: 'annual' }],
    created_at: '2026-03-20T09:00:00Z', approved_at: '2026-03-21T11:00:00Z',
  },
  {
    id: '8', po_number: 'PO-008', title: 'Engineering Tools & Licenses',
    department: 'Engineering', status: 'pending', total: 5400.00,
    requires_ceo: false, date: '2026-03-22',
    creator: { full_name: 'Alaa Mansour' },
    tags: [{ tag: 'developer-tools' }],
    created_at: '2026-03-22T10:00:00Z', approved_at: null,
  },
];

export function useFinancePOs() {
  const [pos, setPos] = useState(MOCK_POS);
  const [isLive, setIsLive] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [statusFilter, setStatusFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('all');

  // ─── Phase 4: swap this mock effect for real Supabase Realtime ───
  useEffect(() => {
    // TODO (Phase 4):
    // const channel = supabase
    //   .channel('finance-po-live')
    //   .on('postgres_changes', { event: '*', schema: 'public', table: 'purchase_orders' },
    //     () => { fetchPOs(); setLastUpdate(new Date()); })
    //   .subscribe();
    // return () => supabase.removeChannel(channel);

    // Mock: simulate a live tick every 30s to update "last updated" timestamp
    const interval = setInterval(() => {
      setLastUpdate(new Date());
    }, 30_000);
    return () => clearInterval(interval);
  }, []);

  const filtered = pos.filter((po) => {
    const statusMatch = statusFilter === 'all' || po.status === statusFilter;
    const deptMatch = deptFilter === 'all' || po.department === deptFilter;
    return statusMatch && deptMatch;
  });

  // ─── Derived stats ───
  const totalCount = pos.length;
  const totalValue = pos.reduce((s, p) => s + p.total, 0);
  const approvedValue = pos.filter(p => p.status === 'approved').reduce((s, p) => s + p.total, 0);
  const pendingValue = pos.filter(p => p.status === 'pending').reduce((s, p) => s + p.total, 0);
  const rejectedCount = pos.filter(p => p.status === 'rejected').length;

  // ─── Department breakdown ───
  const deptBreakdown = DEPARTMENTS.map((dept) => {
    const deptPos = pos.filter(p => p.department === dept);
    const value = deptPos.reduce((s, p) => s + p.total, 0);
    const approved = deptPos.filter(p => p.status === 'approved').reduce((s, p) => s + p.total, 0);
    return { dept, value, approved, count: deptPos.length };
  })
    .filter(d => d.count > 0)
    .sort((a, b) => b.value - a.value);

  const maxDeptValue = deptBreakdown[0]?.value ?? 1;

  return {
    pos: filtered,
    allPos: pos,
    isLive,
    lastUpdate,
    statusFilter, setStatusFilter,
    deptFilter, setDeptFilter,
    stats: { totalCount, totalValue, approvedValue, pendingValue, rejectedCount },
    deptBreakdown,
    maxDeptValue,
    departments: DEPARTMENTS,
  };
}