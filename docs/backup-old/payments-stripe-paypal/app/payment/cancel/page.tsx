'use client'

import { XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default function PaymentCancelPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center px-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <XCircle className="w-20 h-20 text-orange-500" />
          </div>
          <CardTitle className="text-3xl">Payment Cancelled</CardTitle>
          <CardDescription className="text-lg">
            Your payment was not completed
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <p className="text-orange-800 font-medium mb-2">
              No charges were made
            </p>
            <p className="text-orange-700 text-sm">
              You can try again at any time. If you encountered any issues, please contact our support team.
            </p>
          </div>

          <div className="flex flex-col gap-3 pt-4">
            <Link href="/payment">
              <Button className="w-full bg-purple-600 hover:bg-purple-700" size="lg">
                Try Again
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" className="w-full" size="lg">
                Back to Home
              </Button>
            </Link>
          </div>

          <p className="text-xs text-gray-500 text-center">
            Questions? Contact us at{' '}
            <a href="mailto:support@mornhub.help" className="text-purple-600 hover:underline">
              support@mornhub.help
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
