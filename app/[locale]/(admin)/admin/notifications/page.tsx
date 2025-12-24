'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Search,
  Send,
  Users,
  User,
  X,
  Bell,
  Info,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react'
import { toast } from 'sonner'

interface UserOption {
  id: string
  name: string | null
  email: string
}

interface SentNotification {
  id: string
  type: string
  title: string
  message: string | null
  link: string | null
  createdAt: string
  recipientName: string | null
  recipientEmail: string
}

type NotificationType = 'info' | 'success' | 'warning' | 'system' | 'invite'

export default function AdminNotificationsPage() {
  const t = useTranslations('admin.notifications')
  const tCommon = useTranslations('common')

  const typeConfig: Record<
    NotificationType,
    { label: string; icon: React.ReactNode; color: string }
  > = {
    info: {
      label: t('types.info'),
      icon: <Info className="h-4 w-4" />,
      color: 'bg-blue-500',
    },
    success: {
      label: t('types.success'),
      icon: <CheckCircle className="h-4 w-4" />,
      color: 'bg-green-500',
    },
    warning: {
      label: t('types.warning'),
      icon: <AlertTriangle className="h-4 w-4" />,
      color: 'bg-yellow-500',
    },
    system: {
      label: t('types.system'),
      icon: <Bell className="h-4 w-4" />,
      color: 'bg-purple-500',
    },
    invite: {
      label: t('types.invite'),
      icon: <Users className="h-4 w-4" />,
      color: 'bg-indigo-500',
    },
  }
  const [users, setUsers] = useState<UserOption[]>([])
  const [notifications, setNotifications] = useState<SentNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [search, setSearch] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  // Form state
  const [type, setType] = useState<NotificationType>('info')
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [link, setLink] = useState('')
  const [target, setTarget] = useState<'all' | 'selected'>('selected')
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/admin/notifications/send')
        const data = await response.json()
        if (data.users) {
          setUsers(data.users)
        }
        if (data.notifications) {
          setNotifications(data.notifications)
        }
      } catch {
        toast.error(t('toast.loadFailed'))
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [refreshKey])

  const filteredUsers = search
    ? users.filter(
        (u) =>
          u.email.toLowerCase().includes(search.toLowerCase()) ||
          u.name?.toLowerCase().includes(search.toLowerCase())
      )
    : users

  function toggleUser(userId: string) {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    )
  }

  function selectAll() {
    setSelectedUsers(filteredUsers.map((u) => u.id))
  }

  function clearSelection() {
    setSelectedUsers([])
  }

  async function handleSend() {
    if (!title.trim()) {
      toast.error(t('toast.titleRequired'))
      return
    }

    if (target === 'selected' && selectedUsers.length === 0) {
      toast.error(t('toast.selectUser'))
      return
    }

    setSending(true)
    try {
      const response = await fetch('/api/admin/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          title: title.trim(),
          message: message.trim() || undefined,
          link: link.trim() || undefined,
          target,
          userIds: target === 'selected' ? selectedUsers : undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || t('toast.sendFailed'))
      } else {
        toast.success(t('toast.sent', { count: data.count }))
        // Reset form and refresh list
        setTitle('')
        setMessage('')
        setLink('')
        setSelectedUsers([])
        setRefreshKey((k) => k + 1)
      }
    } catch {
      toast.error(t('toast.sendFailed'))
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('pageTitle')}</h1>
        <p className="text-muted-foreground">{t('description')}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Compose */}
        <Card>
          <CardHeader>
            <CardTitle>{t('compose.title')}</CardTitle>
            <CardDescription>{t('compose.description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="type">{t('compose.type')}</Label>
              <Select
                value={type}
                onValueChange={(v) => setType(v as NotificationType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(typeConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <div
                          className={`p-1 rounded ${config.color} text-white`}
                        >
                          {config.icon}
                        </div>
                        {config.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">{t('compose.titleLabel')} *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('compose.titlePlaceholder')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">{t('compose.message')}</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t('compose.messagePlaceholder')}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="link">{t('compose.link')}</Label>
              <Input
                id="link"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder={t('compose.linkPlaceholder')}
              />
            </div>

            {/* Preview */}
            {title && (
              <div className="p-4 border rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground mb-2">
                  {t('compose.preview')}:
                </p>
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2 rounded ${typeConfig[type].color} text-white`}
                  >
                    {typeConfig[type].icon}
                  </div>
                  <div>
                    <p className="font-medium">{title}</p>
                    {message && (
                      <p className="text-sm text-muted-foreground">{message}</p>
                    )}
                    {link && (
                      <p className="text-xs text-blue-500 mt-1">{link}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recipients */}
        <Card>
          <CardHeader>
            <CardTitle>{t('recipients.title')}</CardTitle>
            <CardDescription>{t('recipients.description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button
                variant={target === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTarget('all')}
              >
                <Users className="mr-2 h-4 w-4" />
                {t('recipients.allUsers')}
              </Button>
              <Button
                variant={target === 'selected' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTarget('selected')}
              >
                <User className="mr-2 h-4 w-4" />
                {t('recipients.selectUsers')}
              </Button>
            </div>

            {target === 'selected' && (
              <>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t('recipients.searchPlaceholder')}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {t('recipients.selected', { count: selectedUsers.length })}
                  </span>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={selectAll}>
                      {t('recipients.selectAll')}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={clearSelection}>
                      {tCommon('clear')}
                    </Button>
                  </div>
                </div>

                {/* Selected badges */}
                {selectedUsers.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {selectedUsers.slice(0, 5).map((id) => {
                      const u = users.find((u) => u.id === id)
                      return (
                        <Badge key={id} variant="secondary" className="gap-1">
                          {u?.name || u?.email}
                          <X
                            className="h-3 w-3 cursor-pointer"
                            onClick={() => toggleUser(id)}
                          />
                        </Badge>
                      )
                    })}
                    {selectedUsers.length > 5 && (
                      <Badge variant="outline">
                        {t('recipients.moreCount', {
                          count: selectedUsers.length - 5,
                        })}
                      </Badge>
                    )}
                  </div>
                )}

                {/* User list */}
                <div className="border rounded-lg max-h-64 overflow-y-auto">
                  {loading ? (
                    <p className="p-4 text-center text-muted-foreground">
                      {tCommon('loading')}
                    </p>
                  ) : filteredUsers.length === 0 ? (
                    <p className="p-4 text-center text-muted-foreground">
                      {t('recipients.noUsers')}
                    </p>
                  ) : (
                    filteredUsers.map((u) => (
                      <div
                        key={u.id}
                        className="flex items-center gap-3 p-3 border-b last:border-b-0 hover:bg-muted/50 cursor-pointer"
                        onClick={() => toggleUser(u.id)}
                      >
                        <Checkbox checked={selectedUsers.includes(u.id)} />
                        <div>
                          <p className="text-sm font-medium">
                            {u.name || t('recipients.noName')}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {u.email}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}

            {target === 'all' && (
              <div className="p-4 border rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">
                  {t('recipients.allUsersWarning', { count: users.length })}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Send button */}
      <div className="flex justify-end">
        <Button onClick={handleSend} disabled={sending || !title.trim()}>
          <Send className="mr-2 h-4 w-4" />
          {sending ? t('sendButton.sending') : t('sendButton.send')}
        </Button>
      </div>

      {/* Sent notifications table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('history.title')}</CardTitle>
          <CardDescription>
            {t('history.description', { count: notifications.length })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('history.columns.type')}</TableHead>
                  <TableHead>{t('history.columns.title')}</TableHead>
                  <TableHead>{t('history.columns.recipient')}</TableHead>
                  <TableHead>{t('history.columns.sent')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      {tCommon('loading')}
                    </TableCell>
                  </TableRow>
                ) : notifications.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      {t('history.empty')}
                    </TableCell>
                  </TableRow>
                ) : (
                  notifications.map((n) => (
                    <TableRow key={n.id}>
                      <TableCell>
                        <div
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded text-white text-xs ${
                            typeConfig[n.type as NotificationType]?.color ||
                            'bg-gray-500'
                          }`}
                        >
                          {typeConfig[n.type as NotificationType]?.icon}
                          {typeConfig[n.type as NotificationType]?.label ||
                            n.type}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{n.title}</div>
                          {n.message && (
                            <div className="text-xs text-muted-foreground truncate max-w-xs">
                              {n.message}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {n.recipientName || t('recipients.noName')}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {n.recipientEmail}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(n.createdAt).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
