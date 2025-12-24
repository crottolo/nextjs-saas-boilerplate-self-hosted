'use client'

import { useState, useEffect } from 'react'
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
      toast.error('Failed to fetch products')
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
      toast.error('Failed to fetch archived products')
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
        toast.success(data.message)
        setRefreshKey((k) => k + 1)
      } else {
        toast.error(data.error)
      }
    } catch {
      toast.error('Sync failed')
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
        toast.success('Product created')
        setCreateDialogOpen(false)
        resetForm()
        setRefreshKey((k) => k + 1)
      } else {
        toast.error(data.error)
      }
    } catch {
      toast.error('Failed to create product')
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
        toast.success('Product updated')
        setEditDialogOpen(false)
        setSelectedProduct(null)
        resetForm()
        setRefreshKey((k) => k + 1)
      } else {
        toast.error(data.error)
      }
    } catch {
      toast.error('Failed to update product')
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
            ? 'Product deleted permanently'
            : 'Product archived (has subscriptions)'
        toast.success(message)
        setDeleteDialogOpen(false)
        setSelectedProduct(null)
        setRefreshKey((k) => k + 1)
      } else {
        toast.error(data.error)
      }
    } catch {
      toast.error('Failed to delete product')
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
        toast.success(product.enabled ? 'Product disabled' : 'Product enabled')
        setRefreshKey((k) => k + 1)
      }
    } catch {
      toast.error('Failed to toggle product')
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
          <h1 className="text-2xl font-bold tracking-tight">Stripe Products</h1>
          <p className="text-muted-foreground">
            Manage your subscription plans ({products.length} total)
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant={showArchived ? 'secondary' : 'outline'}
            onClick={handleToggleArchived}
            disabled={loadingArchived}
          >
            <Archive className="mr-2 h-4 w-4" />
            {showArchived ? 'Hide Archived' : 'Show Archived'}
            {archivedProducts.length > 0 && ` (${archivedProducts.length})`}
          </Button>
          <Button variant="outline" onClick={handleSync} disabled={syncing}>
            <RefreshCw
              className={`mr-2 h-4 w-4 ${syncing ? 'animate-spin' : ''}`}
            />
            Sync from Stripe
          </Button>

          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="mr-2 h-4 w-4" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <form onSubmit={handleCreate}>
                <DialogHeader>
                  <DialogTitle>Create Product</DialogTitle>
                  <DialogDescription>
                    Create a new product in Stripe and save it locally.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="Pro Plan"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      placeholder="For professionals and small teams"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="price">Price *</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        value={formPrice}
                        onChange={(e) => setFormPrice(e.target.value)}
                        placeholder="19.00"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="currency">Currency</Label>
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
                      <Label htmlFor="interval">Billing Interval</Label>
                      <Select
                        value={formInterval}
                        onValueChange={setFormInterval}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="month">Monthly</SelectItem>
                          <SelectItem value="year">Yearly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="trialDays">Trial Days</Label>
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
                    <Label htmlFor="features">Features (one per line)</Label>
                    <Textarea
                      id="features"
                      value={formFeatures}
                      onChange={(e) => setFormFeatures(e.target.value)}
                      placeholder="20 projects&#10;50 GB storage&#10;Priority support"
                      rows={4}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="sortOrder">Sort Order</Label>
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
                        <Label htmlFor="popular">Popular</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          id="enabled"
                          checked={formEnabled}
                          onCheckedChange={setFormEnabled}
                        />
                        <Label htmlFor="enabled">Enabled</Label>
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
                    Cancel
                  </Button>
                  <Button type="submit">Create</Button>
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
              <TableHead className="w-[60px]">Order</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Interval</TableHead>
              <TableHead>Trial</TableHead>
              <TableHead>Popular</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  No products. Create one or sync from Stripe.
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
                        {product.interval === 'year' ? 'Yearly' : 'Monthly'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {product.trialDays > 0
                        ? `${product.trialDays} days`
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
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => openEditDialog(product)}
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedProduct(product)
                              setDeleteMode('archive')
                              setDeleteDialogOpen(true)
                            }}
                          >
                            <Archive className="mr-2 h-4 w-4" />
                            Archive
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
                            Delete
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
            Archived Products
          </h2>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Interval</TableHead>
                  <TableHead>Stripe ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingArchived ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      Loading archived products...
                    </TableCell>
                  </TableRow>
                ) : archivedProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      No archived products found.
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
                          {product.interval === 'year' ? 'Yearly' : 'Monthly'}
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
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>
              Update product details. Price cannot be changed (Stripe
              limitation).
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label htmlFor="editName">Name</Label>
              <Input
                id="editName"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editDescription">Description</Label>
              <Input
                id="editDescription"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Price (read-only)</Label>
              <Input
                value={formatPrice(
                  selectedProduct?.price || 0,
                  selectedProduct?.currency || 'eur'
                )}
                disabled
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editFeatures">Features (one per line)</Label>
              <Textarea
                id="editFeatures"
                value={formFeatures}
                onChange={(e) => setFormFeatures(e.target.value)}
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editTrialDays">Trial Days</Label>
                <Input
                  id="editTrialDays"
                  type="number"
                  value={formTrialDays}
                  onChange={(e) => setFormTrialDays(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editSortOrder">Sort Order</Label>
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
                <Label htmlFor="editPopular">Popular</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="editEnabled"
                  checked={formEnabled}
                  onCheckedChange={setFormEnabled}
                />
                <Label htmlFor="editEnabled">Enabled</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {deleteMode === 'delete' ? 'Delete Product' : 'Archive Product'}
            </DialogTitle>
            <DialogDescription>
              {deleteMode === 'delete'
                ? 'This will permanently delete the product from Stripe (only works if never used). If the product has subscriptions, it will be archived instead.'
                : 'This will archive the product in Stripe and remove it from your local database. Existing subscriptions will not be affected.'}
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
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              {deleteMode === 'delete' ? 'Delete' : 'Archive'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
