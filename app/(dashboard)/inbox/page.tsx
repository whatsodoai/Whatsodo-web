'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useBusiness } from '@/contexts/business-context';
import { useAuth } from '@/contexts/auth-context';
import { api } from '@/lib/api';
import { InboxItem, Message, Lead, BusinessMember } from '@/types';
import {
  Search,
  MessageSquare,
  Phone,
  MoreVertical,
  Send,
  User,
  Calendar,
  Tag,
  Smile,
  Wifi,
  WifiOff,
} from 'lucide-react';
import {
  cn,
  formatRelativeTime,
  formatTime,
  getInitials,
  avatarColor,
  STATUS_CONFIG,
  LEAD_STATUSES,
} from '@/lib/utils';
import Link from 'next/link';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';

interface TeamOption {
  id: string;
  name: string;
}

export default function InboxPage() {
  const { activeBusiness } = useBusiness();
  const { user } = useAuth();
  const [inbox, setInbox] = useState<InboxItem[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [msgLoading, setMsgLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [draft, setDraft] = useState('');
  const [connected, setConnected] = useState(false);
  const [teamOptions, setTeamOptions] = useState<TeamOption[]>([]);
  const [onlyAssignedToMe, setOnlyAssignedToMe] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const selectedPhoneRef = useRef<string | null>(null);

  selectedPhoneRef.current = selectedPhone;

  const fetchInbox = useCallback(async () => {
    if (!activeBusiness) return;
    try {
      const [i, l] = await Promise.all([
        api.getInbox(activeBusiness._id),
        api.getLeads(activeBusiness._id),
      ]);
      setInbox(i);
      setLeads(l);
      if (i.length > 0 && !selectedPhoneRef.current) {
        setSelectedPhone(i[0].phone);
      }
    } catch {}
  }, [activeBusiness]);

  // Initial load + periodic fallback poll (30s instead of 4s)
  useEffect(() => {
    if (!activeBusiness) return;
    setLoading(true);
    fetchInbox().finally(() => setLoading(false));
    const timer = setInterval(fetchInbox, 30000);
    return () => clearInterval(timer);
  }, [activeBusiness, fetchInbox]);

  // Team members (for the "Assign to" dropdown)
  useEffect(() => {
    if (!activeBusiness) return;
    api
      .getBusiness(activeBusiness._id)
      .then((biz) => {
        const owner =
          typeof biz.ownerId === 'string' ? null : { id: biz.ownerId._id, name: biz.ownerId.name };
        const members = (biz.members || []).map((m: BusinessMember) =>
          typeof m.userId === 'string' ? null : { id: m.userId._id, name: m.userId.name }
        );
        setTeamOptions([owner, ...members].filter((o): o is TeamOption => !!o));
      })
      .catch(() => {});
  }, [activeBusiness]);

  // Socket.io connection
  useEffect(() => {
    if (!activeBusiness) return;

    const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join:business', activeBusiness._id);
    });

    socket.on('disconnect', () => setConnected(false));

    socket.on('new:message', (payload: { businessId: string; phone: string; message: Message; leadName?: string }) => {
      if (payload.businessId !== activeBusiness._id) return;

      // Update messages panel if this conversation is open
      if (selectedPhoneRef.current === payload.phone) {
        setMessages((prev) => {
          const exists = prev.some((m) => m._id === payload.message._id);
          return exists ? prev : [...prev, payload.message];
        });
      }

      // Refresh inbox list for updated last-message
      fetchInbox();
    });

    return () => {
      socket.emit('leave:business', activeBusiness._id);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [activeBusiness, fetchInbox]);

  useEffect(() => {
    if (!activeBusiness || !selectedPhone) return;
    setMsgLoading(true);
    api
      .getMessages(activeBusiness._id, selectedPhone)
      .then(setMessages)
      .catch(() => setMessages([]))
      .finally(() => setMsgLoading(false));
  }, [activeBusiness, selectedPhone]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!draft.trim() || !selectedPhone || !activeBusiness) return;
    setSending(true);
    const text = draft.trim();
    setDraft('');
    try {
      await api.sendMessage(activeBusiness._id, selectedPhone, text);
      const optimistic = {
        _id: Date.now().toString(),
        businessId: activeBusiness._id,
        phone: selectedPhone,
        direction: 'outgoing' as const,
        message: text,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, optimistic]);
    } catch (err) {
      console.error('Send failed:', err);
    } finally {
      setSending(false);
    }
  };

  const selectedLead = leads.find((l) => l.phone === selectedPhone);
  const selectedItem = inbox.find((i) => i.phone === selectedPhone);

  const handleLeadStatusChange = async (leadId: string, status: import('@/types').LeadStatus) => {
    try {
      await api.updateLeadStatus(leadId, status);
      setLeads((prev) => prev.map((l) => (l._id === leadId ? { ...l, status } : l)));
    } catch {}
  };

  const handleAssignChange = async (leadId: string, userId: string) => {
    try {
      await api.assignLead(leadId, userId || null);
      setLeads((prev) => prev.map((l) => (l._id === leadId ? { ...l, assignedTo: userId || null } : l)));
    } catch {}
  };

  const filteredInbox = inbox.filter((i) => {
    const matchesSearch =
      search === '' ||
      (i.leadName || '').toLowerCase().includes(search.toLowerCase()) ||
      i.phone.includes(search) ||
      i.lastMessage.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    if (onlyAssignedToMe) {
      const lead = leads.find((l) => l.phone === i.phone);
      if (lead?.assignedTo !== user?.id) return false;
    }
    return true;
  });

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-gray-50">
      {/* Conversations List */}
      <div className="w-80 flex-shrink-0 bg-white border-r border-gray-100 flex flex-col">
        {/* Search + connection indicator */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Conversations
            </span>
            <span className={cn('flex items-center gap-1 text-[10px] font-medium', connected ? 'text-green-500' : 'text-gray-400')}>
              {connected ? <Wifi size={10} /> : <WifiOff size={10} />}
              {connected ? 'Live' : 'Polling'}
            </span>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400 transition-all"
            />
          </div>
          {teamOptions.length > 1 && (
            <div className="flex items-center gap-1.5 mt-2">
              <button
                onClick={() => setOnlyAssignedToMe(false)}
                className={cn(
                  'text-xs font-medium px-2.5 py-1 rounded-full transition-colors',
                  !onlyAssignedToMe ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                )}
              >
                All
              </button>
              <button
                onClick={() => setOnlyAssignedToMe(true)}
                className={cn(
                  'text-xs font-medium px-2.5 py-1 rounded-full transition-colors',
                  onlyAssignedToMe ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                )}
              >
                Assigned to me
              </button>
            </div>
          )}
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="space-y-1 p-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-16 skeleton rounded-xl" />
              ))}
            </div>
          ) : filteredInbox.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6">
              <MessageSquare className="w-10 h-10 text-gray-200 mb-3" />
              <p className="text-gray-500 text-sm font-medium">No conversations</p>
              <p className="text-gray-400 text-xs mt-1">
                WhatsApp messages will appear here
              </p>
            </div>
          ) : (
            filteredInbox.map((item) => {
              const isSelected = item.phone === selectedPhone;
              const lead = leads.find((l) => l.phone === item.phone);
              return (
                <button
                  key={item.phone}
                  onClick={() => setSelectedPhone(item.phone)}
                  className={cn(
                    'w-full flex items-center gap-3 p-3.5 transition-colors text-left',
                    isSelected
                      ? 'bg-green-50 border-l-2 border-green-500'
                      : 'hover:bg-gray-50 border-l-2 border-transparent'
                  )}
                >
                  <div
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 relative',
                      avatarColor(item.leadName || item.phone)
                    )}
                  >
                    {getInitials(item.leadName || item.phone)}
                    {item.unread && (
                      <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <p
                        className={cn(
                          'text-sm truncate',
                          isSelected ? 'font-semibold text-gray-900' : 'font-medium text-gray-800'
                        )}
                      >
                        {item.leadName || item.phone}
                      </p>
                      <p className="text-[10px] text-gray-400 flex-shrink-0 ml-2">
                        {formatRelativeTime(item.lastMessageTime)}
                      </p>
                    </div>
                    <p
                      className={cn(
                        'text-xs truncate',
                        item.direction === 'outgoing' ? 'text-gray-400' : 'text-gray-600'
                      )}
                    >
                      {item.direction === 'outgoing' && (
                        <span className="text-green-500 mr-1">↗</span>
                      )}
                      {item.lastMessage}
                    </p>
                    {lead && (
                      <span
                        className={cn(
                          'text-[10px] mt-1 inline-block',
                          STATUS_CONFIG[lead.status].color
                        )}
                      >
                        {lead.status}
                      </span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Chat Window */}
      {selectedPhone && selectedItem ? (
        <div className="flex-1 flex flex-col min-w-0">
          {/* Chat Header */}
          <div className="bg-white border-b border-gray-100 px-5 py-3.5 flex items-center gap-3">
            <div
              className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0',
                avatarColor(selectedItem.leadName || selectedItem.phone)
              )}
            >
              {getInitials(selectedItem.leadName || selectedItem.phone)}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900">
                {selectedItem.leadName || selectedItem.phone}
              </p>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">{selectedItem.phone}</span>
                {selectedLead && (
                  <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded-full', STATUS_CONFIG[selectedLead.status].bg, STATUS_CONFIG[selectedLead.status].color)}>
                    {selectedLead.status}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <a
                href={`tel:${selectedPhone}`}
                className="p-2 rounded-xl text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              >
                <Phone size={16} />
              </a>
              {selectedLead && (
                <Link
                  href={`/leads/${selectedLead._id}`}
                  className="p-2 rounded-xl text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                >
                  <User size={16} />
                </Link>
              )}
              <button className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                <MoreVertical size={16} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div
            className="flex-1 overflow-y-auto p-5 space-y-3"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23e8f5e9' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
            }}
          >
            {msgLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="w-6 h-6 border-2 border-green-200 border-t-green-500 rounded-full animate-spin" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <MessageSquare className="w-12 h-12 text-gray-200 mb-3" />
                <p className="text-gray-400 text-sm">No messages yet</p>
              </div>
            ) : (
              messages.map((msg, idx) => {
                const showDate =
                  idx === 0 ||
                  new Date(msg.createdAt).toDateString() !==
                    new Date(messages[idx - 1].createdAt).toDateString();
                return (
                  <div key={msg._id}>
                    {showDate && (
                      <div className="flex items-center justify-center my-3">
                        <span className="px-3 py-1 bg-white/80 rounded-full text-xs text-gray-400 shadow-sm">
                          {new Date(msg.createdAt).toLocaleDateString('en-IN', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                          })}
                        </span>
                      </div>
                    )}
                    <div
                      className={cn(
                        'flex',
                        msg.direction === 'outgoing' ? 'justify-end' : 'justify-start'
                      )}
                    >
                      <div className="max-w-xs lg:max-w-md">
                        <div
                          className={cn(
                            'px-4 py-2.5 shadow-sm',
                            msg.direction === 'outgoing'
                              ? 'chat-bubble-out text-white'
                              : 'chat-bubble-in text-gray-900'
                          )}
                        >
                          <p className="text-sm leading-relaxed">{msg.message}</p>
                          <p
                            className={cn(
                              'text-[10px] mt-1 text-right',
                              msg.direction === 'outgoing'
                                ? 'text-green-100'
                                : 'text-gray-400'
                            )}
                          >
                            {formatTime(msg.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="bg-white border-t border-gray-100 p-4">
            <div className="flex items-center gap-2 bg-gray-50 rounded-2xl border border-gray-200 px-4 py-2.5">
              <button className="text-gray-400 hover:text-gray-600">
                <Smile size={18} />
              </button>
              <input
                type="text"
                placeholder="Type a message..."
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                className="flex-1 bg-transparent text-sm focus:outline-none text-gray-800 placeholder:text-gray-400"
              />
              <button
                onClick={handleSend}
                disabled={sending || !draft.trim()}
                className={cn(
                  'p-1.5 rounded-xl bg-green-500 text-white hover:bg-green-600 transition-colors',
                  (sending || !draft.trim()) && 'opacity-40 cursor-not-allowed'
                )}
              >
                {sending ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Send size={15} />
                )}
              </button>
            </div>
            <p className="text-[10px] text-gray-400 text-center mt-1.5">
              AI replies automatically · You can also reply manually above
            </p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <MessageSquare className="w-14 h-14 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">Select a conversation</p>
            <p className="text-gray-400 text-sm mt-1">
              Click on a chat to view the conversation
            </p>
          </div>
        </div>
      )}

      {/* Lead Info Panel */}
      {selectedLead && (
        <div className="w-72 flex-shrink-0 bg-white border-l border-gray-100 flex-col overflow-y-auto hidden xl:flex">
          <div className="p-5 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Lead Profile
            </p>
          </div>
          <div className="p-5 space-y-4">
            <div className="text-center">
              <div
                className={cn(
                  'w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-lg mx-auto mb-2',
                  avatarColor(selectedLead.name)
                )}
              >
                {getInitials(selectedLead.name)}
              </div>
              <p className="font-semibold text-gray-900">{selectedLead.name}</p>
              <p className="text-sm text-gray-400 mt-0.5">{selectedLead.phone}</p>
              <select
                value={selectedLead.status}
                onChange={(e) => handleLeadStatusChange(selectedLead._id, e.target.value as import('@/types').LeadStatus)}
                className={cn(
                  'mt-2 text-xs font-medium rounded-full px-2.5 py-1 border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-green-400',
                  STATUS_CONFIG[selectedLead.status].bg,
                  STATUS_CONFIG[selectedLead.status].color,
                )}
              >
                {LEAD_STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {teamOptions.length > 1 && (
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Assigned to</label>
                <select
                  value={selectedLead.assignedTo || ''}
                  onChange={(e) => handleAssignChange(selectedLead._id, e.target.value)}
                  className="input text-sm"
                >
                  <option value="">Unassigned</option>
                  {teamOptions.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-3 text-sm pt-2">
              {[
                { icon: Tag, label: 'Interest', value: selectedLead.interest || '—' },
                { icon: MessageSquare, label: 'Source', value: selectedLead.source },
                {
                  icon: Calendar,
                  label: 'Added',
                  value: new Date(selectedLead.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  }),
                },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-3">
                  <Icon size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400">{label}</p>
                    <p className="text-gray-800 font-medium text-sm">{value}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2 pt-2">
              <a
                href={`tel:${selectedLead.phone}`}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors text-sm font-medium w-full"
              >
                <Phone size={14} /> Call Customer
              </a>
              <Link
                href={`/leads/${selectedLead._id}`}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors text-sm font-medium w-full"
              >
                <User size={14} /> View Lead Profile
              </Link>
              <Link
                href="/appointments"
                className="flex items-center gap-2.5 p-3 rounded-xl bg-orange-50 text-orange-700 hover:bg-orange-100 transition-colors text-sm font-medium w-full"
              >
                <Calendar size={14} /> Book Appointment
              </Link>
            </div>

            {selectedLead.notes && (
              <div className="p-3.5 bg-amber-50 border border-amber-100 rounded-xl">
                <p className="text-xs font-medium text-amber-700 mb-1">Notes</p>
                <p className="text-xs text-amber-900">{selectedLead.notes}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
