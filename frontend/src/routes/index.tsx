import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Transcribe It</h1>
        <p className="text-lg text-gray-600">
          Welcome to your transcription application
        </p>
      </div>
    </div>
  )
}
