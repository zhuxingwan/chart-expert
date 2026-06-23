'use client'

import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Loader2, Sparkles, Lightbulb, Upload, X, ImageIcon } from 'lucide-react'
import type { ChartEngine } from '@/types/chart'
import { toast } from 'sonner'
import { useT, useI18n } from '@/lib/i18n'

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  /** Optional engine hint — if undefined, AI picks the library automatically. */
  engine?: ChartEngine
  onApply: (engine: ChartEngine, config: unknown) => void
}

interface AISuggestion {
  engine: ChartEngine
  recommendedTypeName: string
  reason: string
  config: unknown
}

const PROMPT_IDEAS: Record<string, string[]> = {
  en: [
    'Compare 2024 quarterly sales across product lines',
    'Draw a user checkout flowchart from add-to-cart to payment success',
    'Make a product launch roadmap covering design, dev, test, release',
    'Compare the pros and cons of React and Vue',
    'Show the company org chart with CEO over CTO/CFO/COO',
    'Show weekly visit intensity across different times of day',
    'Draw a purchase conversion funnel',
    'Show project milestones timeline from kickoff to launch',
  ],
  zh: [
    '对比 2024 年各产品线季度销售额',
    '画一个用户下单流程图，从加入购物车到支付成功',
    '做一个产品发布路线图，包含设计、开发、测试、上线',
    '对比 React 和 Vue 的优缺点',
    '展示公司组织架构，CEO 下设 CTO/CFO/COO',
    '展示一周内不同时段的访问热度',
    '画一个购买转化漏斗',
    '展示项目里程碑时间线，从启动到上线',
  ],
  'zh-CN': [
    '对比 2024 年各产品线季度销售额',
    '画一个用户下单流程图，从加入购物车到支付成功',
    '做一个产品发布路线图，包含设计、开发、测试、上线',
    '对比 React 和 Vue 的优缺点',
    '展示公司组织架构，CEO 下设 CTO/CFO/COO',
    '展示一周内不同时段的访问热度',
    '画一个购买转化漏斗',
    '展示项目里程碑时间线，从启动到上线',
  ],
  'zh-TW': [
    '對比 2024 年各產品線季度銷售額',
    '畫一個用戶下單流程圖，從加入購物車到支付成功',
    '做一個產品發佈路線圖，包含設計、開發、測試、上線',
    '對比 React 和 Vue 的優缺點',
    '展示公司組織架構，CEO 下設 CTO/CFO/COO',
    '展示一週內不同時段的訪問熱度',
    '畫一個購買轉化漏斗',
    '展示項目里程碑時間線，從啟動到上線',
  ],
  ja: [
    '2024年四半期別の製品ライン売上を比較',
    'ユーザーの注文フロー図を描く（カート追加から支払い完了まで）',
    '製品リリースロードマップを作成（設計・開発・テスト・リリース）',
    'React と Vue の長所と短所を比較',
    '会社の組織図を表示（CEO配下にCTO/CFO/COO）',
    '曜日別・時間帯別のアクセス熱量を表示',
    '購入コンバージョンファネルを描く',
    'プロジェクトマイルストーンのタイムラインを表示',
  ],
  ko: [
    '2024년 분기별 제품 라인 매출 비교',
    '사용자 주문 흐름도 그리기 (장바구니부터 결제 완료까지)',
    '제품 출시 로드맵 만들기 (디자인, 개발, 테스트, 출시)',
    'React와 Vue의 장단점 비교',
    '회사 조직도 표시 (CEO 아래 CTO/CFO/COO)',
    '요일별 시간대별 방문 강도 표시',
    '구매 전환 깔때기 그리기',
    '프로젝트 마일스톤 타임라인 표시',
  ],
  es: [
    'Comparar las ventas trimestrales de 2024 por línea de producto',
    'Dibujar un diagrama de flujo de pedido de usuario, del carrito al pago',
    'Hacer una hoja de ruta de lanzamiento de producto: diseño, desarrollo, prueba, release',
    'Comparar los pros y contras de React y Vue',
    'Mostrar el organigrama de la empresa con CEO sobre CTO/CFO/COO',
    'Mostrar la intensidad de visitas semanales por franja horaria',
    'Dibujar un embudo de conversión de compra',
    'Mostrar la línea de tiempo de hitos del proyecto, del inicio al lanzamiento',
  ],
  fr: [
    'Comparer les ventes trimestrielles 2024 par ligne de produit',
    'Dessiner un diagramme de flux de commande utilisateur, du panier au paiement',
    'Créer une feuille de route de lancement de produit : conception, dev, test, release',
    'Comparer les avantages et inconvénients de React et Vue',
    'Afficher l\'organigramme de l\'entreprise avec CEO au-dessus de CTO/CFO/COO',
    'Afficher l\'intensité des visites hebdomadaires par tranche horaire',
    'Dessiner un entonnoir de conversion d\'achat',
    'Afficher la chronologie des jalons du projet, du lancement à la mise en production',
  ],
  de: [
    'Vergleiche die Quartalsumsätze 2024 nach Produktlinien',
    'Zeichne ein Bestellflussdiagramm vom Warenkorb bis zur Zahlung',
    'Erstelle eine Produkt-Roadmap: Design, Entwicklung, Test, Release',
    'Vergleiche die Vor- und Nachteile von React und Vue',
    'Zeige das Organigramm mit CEO über CTO/CFO/COO',
    'Zeige die wöchentliche Besuchsintensität nach Tageszeiten',
    'Zeichne einen Kaufkonvertierungstrichter',
    'Zeige die Meilenstein-Zeitachse des Projekts, von Kickoff bis Launch',
  ],
  pt: [
    'Comparar as vendas trimestrais de 2024 por linha de produto',
    'Desenhar um fluxograma de pedido do usuário, do carrinho ao pagamento',
    'Fazer um roteiro de lançamento de produto: design, dev, teste, release',
    'Comparar os prós e contras de React e Vue',
    'Mostrar o organograma da empresa com CEO sobre CTO/CFO/COO',
    'Mostrar a intensidade de visitas semanais por faixa horária',
    'Desenhar um funil de conversão de compra',
    'Mostrar a linha do tempo de marcos do projeto, do início ao lançamento',
  ],
  ru: [
    'Сравнить квартальные продажи 2024 года по продуктовым линиям',
    'Нарисовать блок-схему заказа пользователя, от корзины до оплаты',
    'Создать дорожную карту запуска продукта: дизайн, разработка, тест, релиз',
    'Сравнить плюсы и минусы React и Vue',
    'Показать организационную структуру компании: CEO над CTO/CFO/COO',
    'Показать интенсивность посещений по дням недели и часам',
    'Нарисовать воронку конверсии покупок',
    'Показать временную шкалу этапов проекта, от старта до запуска',
  ],
  ar: [
    'مقارنة مبيعات الربع سنوي 2024 حسب خطوط المنتجات',
    'ارسم مخطط تدفق طلب المستخدم من السلة إلى الدفع',
    'اصنع خارطة طريق لإطلاق المنتج: التصميم، التطوير، الاختبار، الإصدار',
    'قارن مزايا وعيوب React و Vue',
    'اعرض الهيكل التنظيمي للشركة مع الرئيس التنفيذي فوق CTO/CFO/COO',
    'اعرض شدة الزيارات الأسبوعية حسب الفترة الزمنية',
    'ارسم قمع تحويل الشراء',
    'اعرض الجدول الزمني لمعالم المشروع من البداية حتى الإطلاق',
  ],
  hi: [
    '2024 तिमाही बिक्री को उत्पाद लाइनों के अनुसार तुलना करें',
    'उपयोगकर्ता ऑर्डर प्रवाह चित्र बनाएं, कार्ट से भुगतान तक',
    'उत्पाद लॉन्च रोडमैप बनाएं: डिज़ाइन, विकास, परीक्षण, रिलीज़',
    'React और Vue के फायदे और नुकसान की तुलना करें',
    'कंपनी का संगठन चार्ट दिखाएं, CEO के अधीन CTO/CFO/COO',
    'सप्ताह के दिनों और समय के अनुसार विज़िट तीव्रता दिखाएं',
    'खरीद रूपांतरण फ़नल बनाएं',
    'परियोजना की मील के पत्थर की समयरेखा दिखाएं, शुरू से लॉन्च तक',
  ],
  vi: [
    'So sánh doanh số quý 2024 theo dòng sản phẩm',
    'Vẽ sơ đồ luồng đặt hàng người dùng, từ giỏ hàng đến thanh toán',
    'Làm lộ trình ra mắt sản phẩm: thiết kế, phát triển, kiểm thử, phát hành',
    'So sánh ưu nhược điểm của React và Vue',
    'Hiển thị sơ đồ tổ chức công ty, CEO trên CTO/CFO/COO',
    'Hiển thị cường độ truy cập theo ngày và giờ trong tuần',
    'Vẽ phễu chuyển đổi mua hàng',
    'Hiển thị dòng thời gian các mốc dự án, từ khởi động đến ra mắt',
  ],
}

function getPromptIdeas(locale: string): string[] {
  // Try exact match first (e.g. 'zh-CN'), then base language (e.g. 'zh'), then English
  return PROMPT_IDEAS[locale] ?? PROMPT_IDEAS[locale.split('-')[0]] ?? PROMPT_IDEAS.en
}

export function AISuggestDialog({ open, onOpenChange, engine, onApply }: Props) {
  const t = useT()
  const { locale } = useI18n()
  const [prompt, setPrompt] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [suggestion, setSuggestion] = React.useState<AISuggestion | null>(null)
  const [imageDataUrl, setImageDataUrl] = React.useState<string | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const handleSuggest = async () => {
    if (!prompt.trim() && !imageDataUrl) {
      toast.error(t('aiDialog.enterPrompt'))
      return
    }
    setLoading(true)
    setSuggestion(null)
    try {
      const res = await fetch('/api/ai/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, engine, locale, imageDataUrl }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Request failed')
      }
      const data = await res.json()
      setSuggestion(data.result as AISuggestion)
      toast.success(t('aiDialog.generate'))
    } catch (e) {
      toast.error(t('aiDialog.failed', { error: (e as Error).message }))
    } finally {
      setLoading(false)
    }
  }

  const handleApply = () => {
    if (!suggestion) return
    onApply(suggestion.engine, suggestion.config)
    setPrompt('')
    setSuggestion(null)
    setImageDataUrl(null)
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image too large (max 5MB)')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setImageDataUrl(reader.result as string)
    }
    reader.onerror = () => toast.error('Failed to read image')
    reader.readAsDataURL(file)
  }

  const handleRemoveImage = () => {
    setImageDataUrl(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v)
        if (!v) {
          setSuggestion(null)
          setImageDataUrl(null)
        }
      }}
    >
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            {t('aiDialog.title')}
          </DialogTitle>
          <DialogDescription>
            {t('aiDialog.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {/* Prompt input */}
          <div className="grid gap-2">
            <Label>{t('aiDialog.promptLabel')}</Label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={t('aiDialog.promptPlaceholder')}
              rows={3}
              className="resize-none"
            />
            <div className="flex flex-wrap gap-1.5">
              {getPromptIdeas(locale).map((idea) => (
                <button
                  key={idea}
                  onClick={() => setPrompt(idea)}
                  className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground"
                >
                  {idea.length > 32 ? idea.slice(0, 32) + '…' : idea}
                </button>
              ))}
            </div>
          </div>

          {/* Image upload */}
          <div className="grid gap-2">
            <Label className="flex items-center gap-1.5">
              <ImageIcon className="h-3.5 w-3.5" />
              {locale.startsWith('zh') ? '参考图片（可选）' :
               locale.startsWith('ja') ? '参照画像（任意）' :
               locale.startsWith('ko') ? '참조 이미지 (선택)' :
               locale.startsWith('es') ? 'Imagen de referencia (opcional)' :
               locale.startsWith('fr') ? 'Image de référence (optionnel)' :
               locale.startsWith('de') ? 'Referenzbild (optional)' :
               'Reference image (optional)'}
            </Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            {imageDataUrl ? (
              <div className="relative inline-block">
                <img
                  src={imageDataUrl}
                  alt="Reference"
                  className="max-h-32 rounded-lg border object-contain"
                />
                <button
                  onClick={handleRemoveImage}
                  className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-md hover:bg-destructive/90"
                  aria-label="Remove image"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-muted-foreground/40 px-4 py-3 text-sm text-muted-foreground transition-colors hover:border-foreground/40 hover:bg-muted/50"
              >
                <Upload className="h-4 w-4" />
                <span>
                  {locale.startsWith('zh') ? '上传图片（图表截图、草图、数据表等）' :
                   locale.startsWith('ja') ? '画像をアップロード' :
                   locale.startsWith('ko') ? '이미지 업로드' :
                   locale.startsWith('es') ? 'Subir imagen' :
                   locale.startsWith('fr') ? 'Téléverser une image' :
                   locale.startsWith('de') ? 'Bild hochladen' :
                   'Upload image (chart screenshot, sketch, data table, etc.)'}
                </span>
              </button>
            )}
          </div>

          <Button onClick={handleSuggest} disabled={loading} className="gap-1.5">
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {t('aiDialog.generate')}
          </Button>

          {suggestion && (
            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="flex items-start gap-2">
                <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
                <div className="flex-1 space-y-1.5">
                  <div className="text-sm">
                    <span className="text-muted-foreground">{t('aiDialog.recommended')}</span>
                    <span className="font-medium">{suggestion.recommendedTypeName}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{suggestion.reason}</p>
                  <pre className="mt-2 max-h-40 overflow-auto rounded bg-background p-2 text-[10px] leading-relaxed">
{JSON.stringify(suggestion.config, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('actions.cancel')}
          </Button>
          <Button onClick={handleApply} disabled={!suggestion}>
            {t('actions.apply')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
