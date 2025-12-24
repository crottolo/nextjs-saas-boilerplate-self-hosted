'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import {
  MoreHorizontal,
  Plus,
  RefreshCw,
  Pencil,
  Trash2,
  Star,
  Archive,
} from 'lucide-react'
import { toast } from 'sonner'

interface Product {
  id: string
  stripeProductId: string
  stripePriceId: string
  name: string
  description: string | null
  price: number
  currency: string
  interval: string | null
  features: string | null
  limits: string | null
  trialDays: number
  enabled: boolean
  sortOrder: number
  popular: boolean
  createdAt: string
}

interface ArchivedProduct {
  id: string
  stripeProductId: string
  stripePriceId: string | null
  name: string
  description: string | null
  price: number
  currency: string
  interval: string | null
  createdAt: string
  archived: boolean
}

export default function AdminStripeProductsPage() {
  const t = useTranslations('admin.stripe.products')
  const tCommon = useTranslations('common')

  const [products, setProducts] = useState<Product[]>([])
  const [archivedProducts, setArchivedProducts] = useState<ArchivedProduct[]>(
    []
  )
  const [showArchived, setShowArchived] = useState(false)
  const [loadingArchived, setLoadingArchived] = useState(false)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [deleteMode, setDeleteMode] = useState<'archive' | 'delete'>('archive')

  // Form states
  const [formName, setFormName] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formPrice, setFormPrice] = useState('')
  const [formCurrency, setFormCurrency] = useState('eur')
  const [formInterval, setFormInterval] = useState('month')
  const [formFeatures, setFormFeatures] = useState('')
  const [formTrialDays, setFormTrialDays] = useState('0')
  const [formSortOrder, setFormSortOrder] = useState('0')
  const [formPopular, setFormPopular] = useState(false)
  const [formEnabled, setFormEnabled] = useState(false)

  useEffect(() => {
    fetchProducts()
  }, [refreshKey])

  async function fetchProducts() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/stripe/products')
      const data = await res.json()
      if (data.products) {
        setProducts(data.products)
      }
    } catch {
      toast.error(t('toast.fetchFailed'))
    } finally {
      setLoading(false)
    }
  }

  async function fetchArchivedProducts() {
    setLoadingArchived(true)
    try {
      const res = await fetch('/api/admin/stripe/products/archived')
      const data = await res.json()
      if (data.products) {
        setArchivedProducts(data.products)
      }
    } catch {
      toast.error(t('toast.fetchArchivedFailed'))
    } finally {
      setLoadingArchived(false)
    }
  }

  function handleToggleArchived() {
    if (!showArchived && archivedProducts.length === 0) {
      fetchArchivedProducts()
    }
    setShowArchived(!showArchived)
  }

  async function handleSync() {
    setSyncing(true)
    try {
      const res = await fetch('/api/admin/stripe/products/sync', {
        method: 'POST',
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(t('toast.syncSuccess'))
        setRefreshKey((k) => k + 1)
      } else {
        toast.error(data.error)
      }
    } catch {
      toast.error(t('toast.syncFailed'))
    } finally {
      setSyncing(false)
    }
  }

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    try {
      const res = await fetch('/api/admin/stripe/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName,
          description: formDescription || null,
          price: Math.round(parseFloat(formPrice) * 100),
          currency: formCurrency,
          interval: formInterval || null,
          features: formFeatures
            ? formFeatures.split('\n').filter((f) => f.trim())
            : [],
          trialDays: parseInt(formTrialDays) || 0,
          sortOrder: parseInt(formSortOrder) || 0,
          popular: formPopular,
          enabled: formEnabled,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(t('toast.created'))
        setCreateDialogOpen(false)
        resetForm()
        setRefreshKey((k) => k + 1)
      } else {
        toast.error(data.error)
      }
    } catch {
      toast.error(t('toast.createFailed'))
    }
  }

  async function handleUpdate() {
    if (!selectedProduct) return
    try {
      const res = await fetch(
        `/api/admin/stripe/products/${selectedProduct.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formName,
            description: formDescription || null,
            features: formFeatures
              ? formFeatures.split('\n').filter((f) => f.trim())
              : [],
            trialDays: parseInt(formTrialDays) || 0,
            sortOrder: parseInt(formSortOrder) || 0,
            popular: formPopular,
            enabled: formEnabled,
          }),
        }
      )
      const data = await res.json()
      if (res.ok) {
        toast.success(t('toast.updated'))
        setEditDialogOpen(false)
        setSelectedProduct(null)
        resetForm()
        setRefreshKey((k) => k + 1)
      } else {
        toast.error(data.error)
      }
    } catch {
      toast.error(t('toast.updateFailed'))
    }
  }

  async function handleDelete() {
    if (!selectedProduct) return
    try {
      const url =
        deleteMode === 'delete'
          ? `/api/admin/stripe/products/${selectedProduct.id}?force=true`
          : `/api/admin/stripe/products/${selectedProduct.id}`
      const res = await fetch(url, { method: 'DELETE' })
      const data = await res.json()
      if (res.ok) {
        const message =
          data.action === 'deleted'
            ? t('toast.deleted')
            : t('toast.archivedWithSubs')
        toast.success(message)
        setDeleteDialogOpen(false)
        setSelectedProduct(null)
        setRefreshKey((k) => k + 1)
      } else {
        toast.error(data.error)
      }
    } catch {
      toast.error(t('toast.deleteFailed'))
    }
  }

  async function handleToggleEnabled(product: Product) {
    try {
      const res = await fetch(`/api/admin/stripe/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !product.enabled }),
      })
      if (res.ok) {
        toast.success(
          product.enabled ? t('toast.disabled') : t('toast.enabled')
        )
        setRefreshKey((k) => k + 1)
      }
    } catch {
      toast.error(t('toast.toggleFailed'))
    }
  }

  function openEditDialog(product: Product) {
    setSelectedProduct(product)
    setFormName(product.name)
    setFormDescription(product.description || '')
    setFormPrice((product.price / 100).toString())
    setFormCurrency(product.currency)
    setFormInterval(product.interval || 'month')
    setFormFeatures(
      product.features ? JSON.parse(product.features).join('\n') : ''
    )
    setFormTrialDays(product.trialDays.toString())
    setFormSortOrder(product.sortOrder.toString())
    setFormPopular(product.popular)
    setFormEnabled(product.enabled)
    setEditDialogOpen(true)
  }

  function resetForm() {
    setFormName('')
    setFormDescription('')
    setFormPrice('')
    setFormCurrency('eur')
    setFormInterval('month')
    setFormFeatures('')
    setFormTrialDays('0')
    setFormSortOrder('0')
    setFormPopular(false)
    setFormEnabled(false)
  }

  function formatPrice(cents: number, currency: string) {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(cents / 100)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground">
            {t('subtitle', { count: products.length })}
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant={showArchived ? 'secondary' : 'outline'}
            onClick={handleToggleArchived}
            disabled={loadingArchived}
          >
            <Archive className="mr-2 h-4 w-4" />
            {showArchived ? t('hideArchived') : t('showArchived')}
            {archivedProducts.length > 0 && ` (${archivedProducts.length})`}
          </Button>
          <Button variant="outline" onClick={handleSync} disabled={syncing}>
            <RefreshCw
              className={`mr-2 h-4 w-4 ${syncing ? 'animate-spin' : ''}`}
            />
            {t('sync')}
          </Button>

          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="mr-2 h-4 w-4" />
                {t('addProduct')}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <form onSubmit={handleCreate}>
                <DialogHeader>
                  <DialogTitle>{t('createDialog.title')}</DialogTitle>
                  <DialogDescription>
                    {t('createDialog.description')}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
                  <div className="space-y-2">
                    <Label htmlFor="name">{t('form.name')} *</Label>
                    <Input
                      id="name"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder={t('form.namePlaceholder')}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">{t('form.description')}</Label>
                    <Input
                      id="description"
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      placeholder={t('form.descriptionPlaceholder')}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="price">{t('form.price')} *</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        value={formPrice}
                        onChange={(e) => setFormPrice(e.target.value)}
                        placeholder={t('form.pricePlaceholder')}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="currency">{t('form.currency')}</Label>
                      <Select
                        value={formCurrency}
                        onValueChange={setFormCurrency}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="eur">EUR</SelectItem>
                          <SelectItem value="usd">USD</SelectItem>
                          <SelectItem value="gbp">GBP</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="interval">{t('form.interval')}</Label>
                      <Select
                        value={formInterval}
                        onValueChange={setFormInterval}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="month">
                            {t('form.intervalMonthly')}
                          </SelectItem>
                          <SelectItem value="year">
                            {t('form.intervalYearly')}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="trialDays">{t('form.trialDays')}</Label>
                      <Input
                        id="trialDays"
                        type="number"
                        value={formTrialDays}
                        onChange={(e) => setFormTrialDays(e.target.value)}
                        placeholder="14"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="features">{t('form.features')}</Label>
                    <Textarea
                      id="features"
                      value={formFeatures}
                      onChange={(e) => setFormFeatures(e.target.value)}
                      placeholder={t('form.featuresPlaceholder')}
                      rows={4}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="sortOrder">{t('form.sortOrder')}</Label>
                      <Input
                        id="sortOrder"
                        type="number"
                        value={formSortOrder}
                        onChange={(e) => setFormSortOrder(e.target.value)}
                        placeholder="0"
                      />
                    </div>
                    <div className="flex items-center gap-4 pt-6">
                      <div className="flex items-center gap-2">
                        <Switch
                          id="popular"
                          checked={formPopular}
                          onCheckedChange={setFormPopular}
                        />
                        <Label htmlFor="popular">{t('form.popular')}</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          id="enabled"
                          checked={formEnabled}
                          onCheckedChange={setFormEnabled}
                        />
                        <Label htmlFor="enabled">{tCommon('enabled')}</Label>
                      </div>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCreateDialogOpen(false)}
                  >
                    {tCommon('cancel')}
                  </Button>
                  <Button type="submit">{t('createDialog.submit')}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px]">{t('table.order')}</TableHead>
              <TableHead>{t('table.name')}</TableHead>
              <TableHead>{t('table.price')}</TableHead>
              <TableHead>{t('table.interval')}</TableHead>
              <TableHead>{t('table.trial')}</TableHead>
              <TableHead>{t('table.popular')}</TableHead>
              <TableHead>{t('table.status')}</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  {tCommon('loading')}
                </TableCell>
              </TableRow>
            ) : products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  {t('table.empty')}
                </TableCell>
              </TableRow>
            ) : (
              [...products]
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="text-center font-mono text-sm">
                      {product.sortOrder}
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{product.name}</span>
                      {product.description && (
                        <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                          {product.description}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      {formatPrice(product.price, product.currency)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {product.interval === 'year'
                          ? t('form.intervalYearly')
                          : t('form.intervalMonthly')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {product.trialDays > 0
                        ? t('table.trialDays', { days: product.trialDays })
                        : '-'}
                    </TableCell>
                    <TableCell>
                      {product.popular && (
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      )}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={product.enabled}
                        onCheckedChange={() => handleToggleEnabled(product)}
                      />
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>
                            {tCommon('actions')}
                          </DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => openEditDialog(product)}
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            {tCommon('edit')}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedProduct(product)
                              setDeleteMode('archive')
                              setDeleteDialogOpen(true)
                            }}
                          >
                            <Archive className="mr-2 h-4 w-4" />
                            {t('archive')}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => {
                              setSelectedProduct(product)
                              setDeleteMode('delete')
                              setDeleteDialogOpen(true)
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {tCommon('delete')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Archived Products Section */}
      {showArchived && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Archive className="h-5 w-5" />
            {t('archivedSection.title')}
          </h2>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('table.name')}</TableHead>
                  <TableHead>{t('table.price')}</TableHead>
                  <TableHead>{t('table.interval')}</TableHead>
                  <TableHead>{t('archivedSection.stripeId')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingArchived ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      {t('archivedSection.loading')}
                    </TableCell>
                  </TableRow>
                ) : archivedProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      {t('archivedSection.empty')}
                    </TableCell>
                  </TableRow>
                ) : (
                  archivedProducts.map((product) => (
                    <TableRow key={product.id} className="opacity-60">
                      <TableCell>
                        <span className="font-medium">{product.name}</span>
                        {product.description && (
                          <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                            {product.description}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        {formatPrice(product.price, product.currency)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {product.interval === 'year'
                            ? t('form.intervalYearly')
                            : t('form.intervalMonthly')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs">
                          {product.stripeProductId}
                        </code>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('editDialog.title')}</DialogTitle>
            <DialogDescription>{t('editDialog.description')}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label htmlFor="editName">{t('form.name')}</Label>
              <Input
                id="editName"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editDescription">{t('form.description')}</Label>
              <Input
                id="editDescription"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('editDialog.priceReadonly')}</Label>
              <Input
                value={formatPrice(
                  selectedProduct?.price || 0,
                  selectedProduct?.currency || 'eur'
                )}
                disabled
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editFeatures">{t('form.features')}</Label>
              <Textarea
                id="editFeatures"
                value={formFeatures}
                onChange={(e) => setFormFeatures(e.target.value)}
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editTrialDays">{t('form.trialDays')}</Label>
                <Input
                  id="editTrialDays"
                  type="number"
                  value={formTrialDays}
                  onChange={(e) => setFormTrialDays(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editSortOrder">{t('form.sortOrder')}</Label>
                <Input
                  id="editSortOrder"
                  type="number"
                  value={formSortOrder}
                  onChange={(e) => setFormSortOrder(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  id="editPopular"
                  checked={formPopular}
                  onCheckedChange={setFormPopular}
                />
                <Label htmlFor="editPopular">{t('form.popular')}</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="editEnabled"
                  checked={formEnabled}
                  onCheckedChange={setFormEnabled}
                />
                <Label htmlFor="editEnabled">{tCommon('enabled')}</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              {tCommon('cancel')}
            </Button>
            <Button onClick={handleUpdate}>{tCommon('save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {deleteMode === 'delete'
                ? t('deleteDialog.titleDelete')
                : t('deleteDialog.titleArchive')}
            </DialogTitle>
            <DialogDescription>
              {deleteMode === 'delete'
                ? t('deleteDialog.descriptionDelete')
                : t('deleteDialog.descriptionArchive')}
            </DialogDescription>
          </DialogHeader>
          {selectedProduct && (
            <div className="py-4">
              <p className="font-medium">{selectedProduct.name}</p>
              <p className="text-sm text-muted-foreground">
                {formatPrice(selectedProduct.price, selectedProduct.currency)} /{' '}
                {selectedProduct.interval}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              {tCommon('cancel')}
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              {deleteMode === 'delete' ? tCommon('delete') : t('archive')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
