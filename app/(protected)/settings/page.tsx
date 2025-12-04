import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { AlgoliaSyncCard } from "@/components/settings/algolia-sync-card"

export const metadata = {
  title: "Settings | Luxe Collections",
  description: "Configure your store settings",
}

export default function SettingsPage() {
  return (
    <>
      <PageHeader title="Settings" breadcrumbs={[{ label: "Settings" }]} />
      <div className="flex flex-1 flex-col gap-6 p-4 pt-0 w-full">
        {/* Store Information */}
        <Card>
          <CardHeader>
            <CardTitle>Store Information</CardTitle>
            <CardDescription>Basic information about your boutique store.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="store_name">Store Name</Label>
                <Input id="store_name" defaultValue="My Boutique" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="store_phone">Phone Number</Label>
                <Input id="store_phone" defaultValue="+254 700 000 000" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="store_address">Address</Label>
              <Input id="store_address" defaultValue="123 Main Street, Nairobi" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="store_email">Email</Label>
              <Input id="store_email" type="email" defaultValue="info@myboutique.co.ke" />
            </div>
          </CardContent>
        </Card>

        {/* Algolia Search Settings */}
        <AlgoliaSyncCard />

        {/* Tax Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Tax Settings</CardTitle>
            <CardDescription>Configure tax rates for your transactions.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="vat_rate">VAT Rate (%)</Label>
                <Input id="vat_rate" type="number" defaultValue="16" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tax_pin">KRA PIN</Label>
                <Input id="tax_pin" defaultValue="A000000000X" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Include Tax in Prices</Label>
                <p className="text-sm text-muted-foreground">Display prices with tax included</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* M-Pesa Settings */}
        <Card>
          <CardHeader>
            <CardTitle>M-Pesa Integration</CardTitle>
            <CardDescription>Configure M-Pesa STK Push for payments.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="mpesa_shortcode">Business Shortcode</Label>
                <Input id="mpesa_shortcode" placeholder="174379" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mpesa_till">Till Number</Label>
                <Input id="mpesa_till" placeholder="123456" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable M-Pesa Payments</Label>
                <p className="text-sm text-muted-foreground">Accept payments via M-Pesa STK Push</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* Inventory Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Inventory Settings</CardTitle>
            <CardDescription>Configure stock management preferences.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="low_stock_threshold">Default Low Stock Threshold</Label>
                <Input id="low_stock_threshold" type="number" defaultValue="10" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reorder_quantity">Default Reorder Quantity</Label>
                <Input id="reorder_quantity" type="number" defaultValue="50" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Low Stock Alerts</Label>
                <p className="text-sm text-muted-foreground">Get notified when stock is low</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto-generate SKU</Label>
                <p className="text-sm text-muted-foreground">Automatically generate SKU for new products</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* Receipt Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Receipt Settings</CardTitle>
            <CardDescription>Customize receipt appearance and content.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="receipt_header">Receipt Header</Label>
              <Input id="receipt_header" defaultValue="Thank you for shopping with us!" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="receipt_footer">Receipt Footer</Label>
              <Input id="receipt_footer" defaultValue="Returns accepted within 7 days with receipt" />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Print Receipt Automatically</Label>
                <p className="text-sm text-muted-foreground">Print receipt after each sale</p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        <Separator />

        <div className="flex justify-end gap-4">
          <Button variant="outline">Reset to Defaults</Button>
          <Button>Save Changes</Button>
        </div>
      </div>
    </>
  )
}
