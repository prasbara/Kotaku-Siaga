import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export default async function SupabaseDemoPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: reports, error } = await supabase.from('reports').select('*').limit(5)

  return (
    <div className="max-w-4xl mx-auto p-8 font-sans">
      <div className="bg-white rounded-xl shadow p-6 border border-gray-100">
        <h1 className="text-2xl font-bold mb-4 text-gray-900">Supabase Connection Test</h1>
        {error ? (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800">
            <p className="font-semibold">Status: Connected to Supabase (Table might need setup)</p>
            <p className="text-sm mt-1 text-gray-600">
              Response from project: <code className="bg-gray-100 px-1 rounded">{process.env.NEXT_PUBLIC_SUPABASE_URL}</code>
            </p>
            <pre className="text-xs mt-3 p-3 bg-white rounded border overflow-x-auto">
              {JSON.stringify(error, null, 2)}
            </pre>
          </div>
        ) : (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900">
            <p className="font-semibold flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              Supabase Connection Successful!
            </p>
            <p className="text-sm mt-1">
              Successfully queried <code className="font-mono">reports</code> table. Found {reports?.length ?? 0} record(s).
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
