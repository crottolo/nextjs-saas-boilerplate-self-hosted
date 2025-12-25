'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TranslationInput } from '@/components/admin/translation-input'
import type { LocalizedField } from '@/lib/db/localized'
import { getLocalized } from '@/lib/db/localized'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Plus, Pencil, Trash2, Star } from 'lucide-react'
import { toast } from 'sonner'

interface Plan {
  id: string
  name: LocalizedField
  description: LocalizedField | null
  price: number
  credits: number
  maxOrganizations: number
  sortOrder: number
  isDefault: boolean
  linkedProductsCount: number
}

export default function AdminPlansPage() {
  const t = useTranslations('admin.plans')
  const tCommon = useTranslations('common')

  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null)
  const [planToDelete, setPlanToDelete] = useState<Plan | null>(null)
  const [saving, setSaving] = useState(false)

  // Form state
  const [formId, setFormId] = useState('')
  const [formName, setFormName] = useState<LocalizedField>({})
  const [formDescription, setFormDescription] = useState<LocalizedField>({})
  const [formPrice, setFormPrice] = useState('')
  const [formCredits, setFormCredits] = useState('')
  const [formMaxOrgs, setFormMaxOrgs] = useState('')
  const [formSortOrder, setFormSortOrder] = useState('')
  const [formIsDefault, setFormIsDefault] = useState(false)

  const fetchPlans = async () => {
    try {
      const res = await fetch('/api/admin/plans')
      const data = await res.json()
      if (data.plans) {
        setPlans(data.plans)
      }
    } catch {
      toast.error(t('toast.fetchFailed'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPlans()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const resetForm = () => {
    setFormId('')
    setFormName({})
    setFormDescription({})
    setFormPrice('')
    setFormCredits('')
    setFormMaxOrgs('1')
    setFormSortOrder('0')
    setFormIsDefault(false)
    setEditingPlan(null)
  }

  const openCreateDialog = () => {
    resetForm()
    setDialogOpen(true)
  }

  const openEditDialog = (plan: Plan) => {
    setEditingPlan(plan)
    setFormId(plan.id)
    setFormName(plan.name)
    setFormDescription(plan.description || {})
    setFormPrice((plan.price / 100).toFixed(2))
    setFormCredits(plan.credits.toString())
    setFormMaxOrgs(plan.maxOrganizations.toString())
    setFormSortOrder(plan.sortOrder.toString())
    setFormIsDefault(plan.isDefault)
    setDialogOpen(true)
  }

  const handleSave = async () => {
    const hasName = Object.values(formName).some((v) => v && v.trim())
    if (!formId.trim() || !hasName) {
      toast.error(t('form.id') + ' / ' + t('form.name') + ' required')
      return
    }

    setSaving(true)
    try {
      const method = editingPlan ? 'PUT' : 'POST'
      const res = await fetch('/api/admin/plans', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: formId.trim().toLowerCase(),
          name: formName,
          description:
            Object.keys(formDescription).length > 0 ? formDescription : null,
          price: Math.round(parseFloat(formPrice || '0') * 100),
          credits: parseInt(formCredits || '0', 10),
          maxOrganizations: parseInt(formMaxOrgs || '1', 10),
          sortOrder: parseInt(formSortOrder || '0', 10),
          isDefault: formIsDefault,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || t('toast.saveFailed'))
        return
      }

      toast.success(editingPlan ? t('toast.updated') : t('toast.created'))
      setDialogOpen(false)
      resetForm()
      fetchPlans()
    } catch {
      toast.error(t('toast.saveFailed'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!planToDelete) return

    try {
      const res = await fetch(`/api/admin/plans?id=${planToDelete.id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || t('toast.cannotDelete'))
        return
      }

      toast.success(t('toast.deleted'))
      setDeleteDialogOpen(false)
      setPlanToDelete(null)
      fetchPlans()
    } catch {
      toast.error(t('toast.cannotDelete'))
    }
  }

  const formatPrice = (cents: number) => {
    return `€${(cents / 100).toFixed(2)}`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground">{t('description')}</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              {t('addPlan')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingPlan ? t('editDialog.title') : t('createDialog.title')}
              </DialogTitle>
              <DialogDescription>
                {editingPlan
                  ? t('editDialog.description')
                  : t('createDialog.description')}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
              <div className="space-y-2">
                <Label htmlFor="id">{t('form.id')}</Label>
                <Input
                  id="id"
                  value={formId}
                  onChange={(e) => setFormId(e.target.value)}
                  placeholder={t('form.idPlaceholder')}
                  disabled={!!editingPlan}
                />
                <p className="text-xs text-muted-foreground">
                  {t('form.idHint')}
                </p>
              </div>

              <TranslationInput
                label={t('form.name') + ' *'}
                value={formName}
                onChange={setFormName}
              />

              <TranslationInput
                label={t('form.description')}
                value={formDescription}
                onChange={setFormDescription}
                multiline
              />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">{t('form.price')}</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="credits">{t('form.credits')}</Label>
                  <Input
                    id="credits"
                    type="number"
                    min="0"
                    value={formCredits}
                    onChange={(e) => setFormCredits(e.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maxOrgs">{t('form.maxOrganizations')}</Label>
                  <Input
                    id="maxOrgs"
                    type="number"
                    value={formMaxOrgs}
                    onChange={(e) => setFormMaxOrgs(e.target.value)}
                    placeholder="1"
                  />
                  <p className="text-xs text-muted-foreground">
                    {t('form.maxOrganizationsHint')}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sortOrder">{t('form.sortOrder')}</Label>
                  <Input
                    id="sortOrder"
                    type="number"
                    min="0"
                    value={formSortOrder}
                    onChange={(e) => setFormSortOrder(e.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="isDefault"
                  checked={formIsDefault}
                  onCheckedChange={(checked) =>
                    setFormIsDefault(checked === true)
                  }
                />
                <Label htmlFor="isDefault" className="cursor-pointer">
                  {t('form.isDefault')}
                </Label>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={saving}
              >
                {tCommon('cancel')}
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? tCommon('saving') : tCommon('save')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px]">{t('table.order')}</TableHead>
              <TableHead>{t('table.id')}</TableHead>
              <TableHead>{t('table.name')}</TableHead>
              <TableHead className="text-right">{t('table.price')}</TableHead>
              <TableHead className="text-right">{t('table.credits')}</TableHead>
              <TableHead className="text-right">{t('table.maxOrgs')}</TableHead>
              <TableHead className="text-center">
                {t('table.linkedProducts')}
              </TableHead>
              <TableHead className="w-[100px]">{tCommon('actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  {tCommon('loading')}
                </TableCell>
              </TableRow>
            ) : plans.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  {t('table.empty')}
                </TableCell>
              </TableRow>
            ) : (
              plans.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell className="text-muted-foreground">
                    {plan.sortOrder}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <code className="text-sm">{plan.id}</code>
                      {plan.isDefault && (
                        <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {getLocalized(plan.name, 'en')}
                      </div>
                      {plan.description && (
                        <div className="text-xs text-muted-foreground truncate max-w-xs">
                          {getLocalized(plan.description, 'en')}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {formatPrice(plan.price)}
                  </TableCell>
                  <TableCell className="text-right">{plan.credits}</TableCell>
                  <TableCell className="text-right">
                    {plan.maxOrganizations === -1 ? (
                      <span className="text-muted-foreground">
                        {t('table.unlimited')}
                      </span>
                    ) : (
                      plan.maxOrganizations
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {plan.linkedProductsCount > 0 ? (
                      <Badge variant="secondary">
                        {plan.linkedProductsCount}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">0</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(plan)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setPlanToDelete(plan)
                          setDeleteDialogOpen(true)
                        }}
                        disabled={plan.linkedProductsCount > 0}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteDialog.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {planToDelete?.linkedProductsCount
                ? t('deleteDialog.cannotDelete')
                : t('deleteDialog.description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon('cancel')}</AlertDialogCancel>
            {!planToDelete?.linkedProductsCount && (
              <AlertDialogAction onClick={handleDelete}>
                {tCommon('delete')}
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
