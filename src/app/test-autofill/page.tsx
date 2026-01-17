'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

export default function TestAutofillPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-soft-white to-pale-blue/30 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-4xl font-bold text-ocean-blue mb-8">
          Autofill Yellow Background Test
        </h1>

        {/* Test 1: Regular Button (from shadcn/ui) */}
        <Card>
          <CardHeader>
            <CardTitle>Test 1: Regular Button (shadcn/ui with inline styles)</CardTitle>
          </CardHeader>
          <CardContent>
            <Button className="w-full">Regular Button</Button>
            <p className="text-sm text-gray-600 mt-2">
              This uses the Button component with inline white inset shadow
            </p>
          </CardContent>
        </Card>

        {/* Test 2: Button with orange styling (Dev Mode Bypass) */}
        <Card>
          <CardHeader>
            <CardTitle>Test 2: Button with Orange Border (like Dev Mode Bypass)</CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              className="w-full border-orange-500 text-orange-600 hover:bg-orange-50"
            >
              🔧 Dev Mode Bypass Style
            </Button>
            <p className="text-sm text-gray-600 mt-2">
              Orange border, orange text, hover orange background
            </p>
          </CardContent>
        </Card>

        {/* Test 3: Native button with inline styles */}
        <Card>
          <CardHeader>
            <CardTitle>Test 3: Native Button with Inline Styles</CardTitle>
          </CardHeader>
          <CardContent>
            <button
              className="w-full px-4 py-2 border rounded-md"
              style={{
                WebkitBoxShadow: '0 0 0 1000px white inset',
                boxShadow: '0 0 0 1000px white inset',
                WebkitTextFillColor: 'rgb(15, 23, 42)',
                backgroundColor: 'white',
                transition: 'background-color 5000s ease-in-out 0s',
              }}
            >
              Native Button with White Inset
            </button>
            <p className="text-sm text-gray-600 mt-2">
              Direct inline styles with white inset shadow
            </p>
          </CardContent>
        </Card>

        {/* Test 4: Native button NO inline styles */}
        <Card>
          <CardHeader>
            <CardTitle>Test 4: Native Button WITHOUT Inline Styles</CardTitle>
          </CardHeader>
          <CardContent>
            <button className="w-full px-4 py-2 border rounded-md bg-white">
              Native Button - No Inline Styles
            </button>
            <p className="text-sm text-gray-600 mt-2">
              Should show yellow if autofill is being applied
            </p>
          </CardContent>
        </Card>

        {/* Test 5: Input field (working solution) */}
        <Card>
          <CardHeader>
            <CardTitle>Test 5: Input Field (Known Working Solution)</CardTitle>
          </CardHeader>
          <CardContent>
            <Input placeholder="Email address" type="email" name="email" />
            <p className="text-sm text-gray-600 mt-2">
              Input component with working autofill prevention
            </p>
          </CardContent>
        </Card>

        {/* Test 6: Div styled as button */}
        <Card>
          <CardHeader>
            <CardTitle>Test 6: Div Styled as Button</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="w-full px-4 py-2 border rounded-md bg-white text-center cursor-pointer"
              style={{
                WebkitBoxShadow: '0 0 0 1000px white inset',
                boxShadow: '0 0 0 1000px white inset',
                WebkitTextFillColor: 'rgb(15, 23, 42)',
                transition: 'background-color 5000s ease-in-out 0s',
              }}
            >
              Div as Button with Inline Styles
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Using div instead of button element
            </p>
          </CardContent>
        </Card>

        {/* Test 7: Card background test */}
        <Card>
          <CardHeader>
            <CardTitle>Test 7: Card Background</CardTitle>
          </CardHeader>
          <CardContent>
            <p>This is card content. Check if the card itself has yellow background.</p>
            <p className="text-sm text-gray-600 mt-2">
              Card component with inline white inset shadow
            </p>
          </CardContent>
        </Card>

        {/* Test 8: Button with NO classes, only inline backgroundColor */}
        <Card>
          <CardHeader>
            <CardTitle>Test 8: Button with ONLY Inline backgroundColor</CardTitle>
          </CardHeader>
          <CardContent>
            <button
              style={{
                width: '100%',
                padding: '0.5rem 1rem',
                border: '1px solid #ccc',
                borderRadius: '0.375rem',
                backgroundColor: 'white',
              }}
            >
              Button - Inline backgroundColor: white
            </button>
            <p className="text-sm text-gray-600 mt-2">
              No Tailwind classes, only inline styles
            </p>
          </CardContent>
        </Card>

        {/* Test 9: Check bg-background class */}
        <Card>
          <CardHeader>
            <CardTitle>Test 9: Div with bg-background Class</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full px-4 py-2 border rounded-md bg-background text-center">
              Div with bg-background Tailwind class
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Testing if bg-background class causes yellow
            </p>
          </CardContent>
        </Card>

        {/* Test 10: Intentional Yellow (Control) */}
        <Card>
          <CardHeader>
            <CardTitle>Test 10: Intentional Yellow (Control)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full px-4 py-2 border rounded-md bg-yellow-300 text-center">
              Intentional Yellow Background
            </div>
            <p className="text-sm text-gray-600 mt-2">
              This SHOULD be yellow - control test
            </p>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="bg-blue-50 border-blue-300">
          <CardHeader>
            <CardTitle>🔍 What to Look For</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-2 text-sm">
              <li><strong>Tests 1-3:</strong> Should be WHITE (no yellow)</li>
              <li><strong>Test 4:</strong> Might show yellow (no prevention)</li>
              <li><strong>Test 5:</strong> Should be WHITE (known working)</li>
              <li><strong>Test 6-7:</strong> Should be WHITE</li>
              <li><strong>Test 8:</strong> Should be YELLOW (control)</li>
            </ul>
            <p className="mt-4 font-semibold">
              Screenshot this page and show me which tests have yellow backgrounds!
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
