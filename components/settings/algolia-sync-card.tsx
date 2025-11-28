"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, RefreshCw, CheckCircle2, AlertCircle, Search } from "lucide-react"
import { syncAllToAlgolia, configureAlgoliaIndexes } from "@/lib/actions/algolia"

type SyncStatus = "idle" | "syncing" | "success" | "error"

interface SyncResult {
  products: { success: boolean; count: number; error: string | null }
  customers: { success: boolean; count: number; error: string | null }
  suppliers: { success: boolean; count: number; error: string | null }
  inventory: { success: boolean; count: number; error: string | null }
}

export function AlgoliaSyncCard() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle")
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null)
  const [configuring, setConfiguring] = useState(false)
  const [configureSuccess, setConfigureSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSyncAll = async () => {
    setSyncStatus("syncing")
    setError(null)
    setSyncResult(null)

    try {
      const result = await syncAllToAlgolia()
      setSyncResult(result)
      setSyncStatus("success")
    } catch (err) {
      console.error("Sync error:", err)
      setError(err instanceof Error ? err.message : "Failed to sync data to Algolia")
      setSyncStatus("error")
    }
  }

  const handleConfigureIndexes = async () => {
    setConfiguring(true)
    setError(null)
    setConfigureSuccess(false)

    try {
      await configureAlgoliaIndexes()
      setConfigureSuccess(true)
    } catch (err) {
      console.error("Configure error:", err)
      setError(err instanceof Error ? err.message : "Failed to configure Algolia indexes")
    } finally {
      setConfiguring(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          <CardTitle>Algolia Search</CardTitle>
        </div>
        <CardDescription>
          Sync your data to Algolia for fast, typo-tolerant search across products, customers, suppliers, and inventory.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Environment Variables Info */}
        <div className="rounded-lg border p-4 space-y-2">
          <p className="text-sm font-medium">Required Environment Variables:</p>
          <div className="grid gap-1 text-sm text-muted-foreground font-mono">
            <span>ALGOLIA_APP_ID</span>
            <span>ALGOLIA_ADMIN_API_KEY</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Add these in the Vars section of the sidebar or your Vercel project settings.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={handleConfigureIndexes} disabled={configuring}>
            {configuring ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Configuring...
              </>
            ) : (
              "Configure Indexes"
            )}
          </Button>

          <Button onClick={handleSyncAll} disabled={syncStatus === "syncing"}>
            {syncStatus === "syncing" ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Sync All Data
              </>
            )}
          </Button>
        </div>

        {/* Configure Success */}
        {configureSuccess && (
          <Alert>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <AlertDescription>Algolia indexes configured successfully!</AlertDescription>
          </Alert>
        )}

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Success Result */}
        {syncStatus === "success" && syncResult && (
          <Alert>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium">Sync completed successfully!</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">Products: {syncResult.products.count}</Badge>
                  <Badge variant="secondary">Customers: {syncResult.customers.count}</Badge>
                  <Badge variant="secondary">Suppliers: {syncResult.suppliers.count}</Badge>
                  <Badge variant="secondary">Inventory: {syncResult.inventory.count}</Badge>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Usage Info */}
        <div className="text-sm text-muted-foreground space-y-1">
          <p>
            <strong>Configure Indexes:</strong> Set up searchable attributes and facets (run once).
          </p>
          <p>
            <strong>Sync All Data:</strong> Push all existing data to Algolia indexes.
          </p>
          <p className="text-xs">New records are automatically synced when created or updated.</p>
        </div>
      </CardContent>
    </Card>
  )
}
