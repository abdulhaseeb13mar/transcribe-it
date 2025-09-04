import { useState, type ChangeEvent, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { store } from '../../store'
import { UserRole } from '../../types/enums'
import { documentService } from '../../services/documentService'
import { Button } from '../../components/ui/button'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
// no Textarea needed; rendering markdown view
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select'

export const Route = createFileRoute('/dashboard/translate')({
  beforeLoad: () => {
    const state = store.getState()
    const { isAuthenticated, user } = state.auth

    if (!isAuthenticated || !user) {
      throw redirect({
        to: '/',
        search: {
          redirect: undefined,
        },
      })
    }

    if (user.role !== UserRole.ADMIN) {
      throw redirect({
        to: '/',
        search: {
          redirect: undefined,
        },
      })
    }
  },
  component: TranslatePage,
})

function TranslatePage() {
  const [file, setFile] = useState<File | null>(null)
  const [sourceLang, setSourceLang] = useState('ru')
  const [translation, setTranslation] = useState('')
  const [translating, setTranslating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const viewerRef = useRef<HTMLDivElement>(null)

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null
    setFile(f)
  }

  const handleTranslate = async () => {
    if (!file) {
      setError('Please select a file to translate.')
      return
    }
    if (!sourceLang) {
      setError('Please select a source language')
      return
    }
    setError(null)
    setTranslating(true)
    setTranslation('')
    try {
      // 1) Extract text from the uploaded file
      const extractRes = await documentService.extractTextFromFile(file)
      if (!extractRes.success || !extractRes.data?.text) {
        throw new Error(extractRes.message || 'Failed to extract text')
      }

      // 2) Translate the extracted text to English
      const translateRes = await documentService.translateText({
        text: extractRes.data.text,
        sourceLang,
        targetLang: 'en',
      })
      if (translateRes.success && translateRes.data) {
        setTranslation(translateRes.data.translation)
      } else {
        throw new Error(translateRes.message || 'Translation failed')
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to translate text')
    } finally {
      setTranslating(false)
    }
  }

  const languages = [
    { code: 'ru', label: 'Russian' },
    { code: 'uz', label: 'Uzbek' },
  ]

  const handleExportDocx = async () => {
    if (!translation || !viewerRef.current) return
    const contentHtml = viewerRef.current.innerHTML || ''
    const styles = `
      <style>
        body { font-family: Arial, Helvetica, sans-serif; font-size: 12pt; color: #1f2937; }
        h1 { font-size: 24pt; font-weight: 700; margin: 18pt 0 12pt; }
        h2 { font-size: 18pt; font-weight: 600; margin: 16pt 0 10pt; }
        h3 { font-size: 14pt; font-weight: 600; margin: 12pt 0 8pt; }
        p { margin: 8pt 0; }
        ul, ol { margin: 8pt 0 8pt 18pt; }
        li { margin: 4pt 0; }
        code { background: #e5e7eb; padding: 1pt 3pt; border-radius: 3pt; }
        pre { background: #0f172a; color: #f8fafc; padding: 8pt; border-radius: 6pt; }
        table { border-collapse: collapse; width: 100%; margin: 8pt 0; }
        th, td { border: 1px solid #cbd5e1; padding: 6pt; text-align: left; vertical-align: top; }
        thead tr { background: #f1f5f9; }
      </style>
    `
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/>${styles}</head><body>${contentHtml}</body></html>`
    try {
      const { default: HTMLtoDOCX } = await import('html-to-docx')
      const docxBuffer = await HTMLtoDOCX(html, null, {
        table: { row: { cantSplit: true } },
        footer: true,
        pageNumber: true,
      })
      const blob = new Blob([docxBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'translation.docx'
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      const blob = new Blob([html], { type: 'application/msword' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'translation.doc'
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
          Translate
        </h1>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-[340px,1fr]">
          <Card className="self-start">
            <CardHeader>
              <CardTitle>Upload & Translate</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <div className="flex-1">
                  <Label htmlFor="file" className="sr-only">
                    Document
                  </Label>
                  <Input id="file" type="file" onChange={handleFileChange} />
                </div>
                <div className="min-w-[140px]">
                  <Label className="sr-only">Source Language</Label>
                  <Select value={sourceLang} onValueChange={setSourceLang}>
                    <SelectTrigger>
                      <SelectValue placeholder="Source" />
                    </SelectTrigger>
                    <SelectContent>
                      {languages.map((l) => (
                        <SelectItem key={l.code} value={l.code}>
                          {l.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                className="w-full md:w-auto"
                onClick={handleTranslate}
                disabled={translating || !file}
              >
                {translating ? 'Translating...' : 'Translate'}
              </Button>

              {error && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {error}
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="self-start">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Translation (English)</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportDocx}
                disabled={!translation || translating}
              >
                Download
              </Button>
            </CardHeader>
            <CardContent>
              <div
                ref={viewerRef}
                className="h-[70vh] overflow-auto rounded-md border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 p-4 text-slate-800 dark:text-slate-100"
              >
                {translation ? (
                  <ReactMarkdown
                    className="prose-styles"
                    remarkPlugins={[remarkGfm]}
                  >
                    {translation}
                  </ReactMarkdown>
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-slate-500 text-sm">
                    Translation will appear here.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

//
