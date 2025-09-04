import { useState } from 'react'
import { Button } from '../../ui/button'
import { Card, CardContent } from '../../ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../ui/select'
import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import { Textarea } from '../../ui/textarea'
import { Switch } from '../../ui/switch'
import type { CreatePlanRequest, Plan } from '@/services/plansService'
import { PlanType } from '@/types/enums'

interface PlansDashboardProps {
  plans?: Plan[]
  onCreatePlan?: (planData: CreatePlanRequest) => Promise<void>
  onRefresh?: () => void
}

export function PlansDashboard({
  plans = [],
  onCreatePlan,
  onRefresh,
}: PlansDashboardProps) {
  const [isCreatePlanOpen, setIsCreatePlanOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [newPlanForm, setNewPlanForm] = useState({
    name: '',
    type: '' as PlanType | '',
    credits: '',
    price: '',
    description: '',
    isActive: true,
  })

  const handleCreatePlan = async () => {
    // Validate form fields
    if (!newPlanForm.name.trim()) {
      alert('Please enter a plan name')
      return
    }
    if (!newPlanForm.type) {
      alert('Please select a plan type')
      return
    }
    if (!newPlanForm.credits.trim()) {
      alert('Please enter the number of credits')
      return
    }
    if (!newPlanForm.price.trim()) {
      alert('Please enter the plan price')
      return
    }

    // Validate numeric fields
    const credits = parseInt(newPlanForm.credits)
    if (isNaN(credits) || credits < 0) {
      alert('Credits must be a valid non-negative number')
      return
    }

    const price = parseFloat(newPlanForm.price)
    if (isNaN(price) || price < 0) {
      alert('Price must be a valid non-negative number')
      return
    }

    const planData: CreatePlanRequest = {
      name: newPlanForm.name.trim(),
      type: newPlanForm.type as PlanType,
      credits,
      price,
      description: newPlanForm.description.trim() || undefined,
      isActive: newPlanForm.isActive,
    }

    if (onCreatePlan) {
      try {
        setIsCreating(true)
        await onCreatePlan(planData)

        // Only close dialog and reset form if successful
        setIsCreatePlanOpen(false)
        setNewPlanForm({
          name: '',
          type: '',
          credits: '',
          price: '',
          description: '',
          isActive: true,
        })

        // Refresh the plans list
        if (onRefresh) {
          onRefresh()
        }
      } catch (error) {
        console.error('Failed to create plan:', error)
        // Show error to user - you might want to use a proper toast library
        alert(
          `Failed to create plan: ${error instanceof Error ? error.message : 'Unknown error'}`,
        )
      } finally {
        setIsCreating(false)
      }
    } else {
      // Default behavior - just log for now
      console.log('Creating plan:', planData)
      setIsCreatePlanOpen(false)
      setNewPlanForm({
        name: '',
        type: '',
        credits: '',
        price: '',
        description: '',
        isActive: true,
      })
    }
  }

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price)
  }

  const getPlanTypeDisplayName = (type: PlanType): string => {
    switch (type) {
      case PlanType.BASIC:
        return 'Basic'
      case PlanType.PREMIUM:
        return 'Premium'
      default:
        return type
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Plans
        </h2>
        <Dialog open={isCreatePlanOpen} onOpenChange={setIsCreatePlanOpen}>
          <DialogTrigger asChild>
            <Button>Create Plan</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Plan</DialogTitle>
              <DialogDescription>
                Add a new subscription plan for organizations.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="plan-name">Plan Name *</Label>
                <Input
                  id="plan-name"
                  value={newPlanForm.name}
                  onChange={(e) =>
                    setNewPlanForm((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  placeholder="Enter plan name"
                  required
                />
              </div>

              <div>
                <Label htmlFor="plan-type">Plan Type *</Label>
                <Select
                  value={newPlanForm.type}
                  onValueChange={(value) =>
                    setNewPlanForm((prev) => ({
                      ...prev,
                      type: value as PlanType,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select plan type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={PlanType.BASIC}>Basic</SelectItem>
                    <SelectItem value={PlanType.PREMIUM}>Premium</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="plan-credits">Credits *</Label>
                <Input
                  id="plan-credits"
                  type="number"
                  min="0"
                  value={newPlanForm.credits}
                  onChange={(e) =>
                    setNewPlanForm((prev) => ({
                      ...prev,
                      credits: e.target.value,
                    }))
                  }
                  placeholder="Enter number of credits"
                  required
                />
              </div>

              <div>
                <Label htmlFor="plan-price">Price (USD) *</Label>
                <Input
                  id="plan-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={newPlanForm.price}
                  onChange={(e) =>
                    setNewPlanForm((prev) => ({
                      ...prev,
                      price: e.target.value,
                    }))
                  }
                  placeholder="Enter price in USD"
                  required
                />
              </div>

              <div>
                <Label htmlFor="plan-description">Description</Label>
                <Textarea
                  id="plan-description"
                  value={newPlanForm.description}
                  onChange={(e) =>
                    setNewPlanForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Enter plan description (optional)"
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="plan-active"
                  checked={newPlanForm.isActive}
                  onCheckedChange={(checked) =>
                    setNewPlanForm((prev) => ({
                      ...prev,
                      isActive: checked,
                    }))
                  }
                />
                <Label htmlFor="plan-active">Active</Label>
              </div>

              <Button
                onClick={handleCreatePlan}
                className="w-full"
                disabled={isCreating}
              >
                {isCreating ? 'Creating...' : 'Create Plan'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plan Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Credits</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-gray-500 py-8"
                  >
                    No plans found
                  </TableCell>
                </TableRow>
              ) : (
                plans.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell className="font-medium">{plan.name}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          plan.type === PlanType.PREMIUM
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                        }`}
                      >
                        {getPlanTypeDisplayName(plan.type)}
                      </span>
                    </TableCell>
                    <TableCell>{plan.credits.toLocaleString()}</TableCell>
                    <TableCell>{formatPrice(plan.price)}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          plan.isActive
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
                        }`}
                      >
                        {plan.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </TableCell>
                    <TableCell>
                      {new Date(plan.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
