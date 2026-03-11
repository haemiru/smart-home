import type { ConfirmationSection } from '@/utils/confirmationFormConfig'

interface Props {
  sections: ConfirmationSection[]
  formData: Record<string, string>
  onChange: (key: string, value: string) => void
  readOnly?: boolean
}

export function ConfirmationFormRenderer({ sections, formData, onChange, readOnly }: Props) {
  return (
    <div className="space-y-6">
      {sections.map((section) => (
        <div key={section.key} className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
          <h3 className="mb-4 border-b border-gray-100 pb-2 text-sm font-bold text-gray-800">{section.title}</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {section.fields.map((field) => {
              const value = formData[field.key] ?? ''
              const cls = field.fullWidth ? 'sm:col-span-2' : ''

              if (field.inputType === 'textarea') {
                return (
                  <div key={field.key} className={`sm:col-span-2 ${cls}`}>
                    <label className="mb-1 block text-xs font-medium text-gray-500">
                      {field.label}{field.required && <span className="text-red-500"> *</span>}
                    </label>
                    {readOnly ? (
                      <p className="min-h-[2rem] whitespace-pre-wrap rounded-lg bg-gray-50 px-3 py-2 text-sm">{value || '-'}</p>
                    ) : (
                      <textarea
                        value={value}
                        onChange={(e) => onChange(field.key, e.target.value)}
                        placeholder={field.placeholder}
                        rows={3}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                      />
                    )}
                  </div>
                )
              }

              if (field.inputType === 'radio') {
                return (
                  <div key={field.key} className={cls}>
                    <label className="mb-1 block text-xs font-medium text-gray-500">
                      {field.label}{field.required && <span className="text-red-500"> *</span>}
                    </label>
                    {readOnly ? (
                      <p className="text-sm">{value || '-'}</p>
                    ) : (
                      <div className="flex gap-3">
                        {field.options?.map((opt) => (
                          <label key={opt} className="flex items-center gap-1.5 text-sm">
                            <input
                              type="radio"
                              name={field.key}
                              value={opt}
                              checked={value === opt}
                              onChange={() => onChange(field.key, opt)}
                              className="text-primary-600"
                            />
                            {opt}
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )
              }

              if (field.inputType === 'select') {
                return (
                  <div key={field.key} className={cls}>
                    <label className="mb-1 block text-xs font-medium text-gray-500">
                      {field.label}{field.required && <span className="text-red-500"> *</span>}
                    </label>
                    {readOnly ? (
                      <p className="text-sm">{value || '-'}</p>
                    ) : (
                      <select
                        value={value}
                        onChange={(e) => onChange(field.key, e.target.value)}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                      >
                        <option value="">선택</option>
                        {field.options?.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    )}
                  </div>
                )
              }

              if (field.inputType === 'checkbox') {
                return (
                  <div key={field.key} className={cls}>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={value === 'true'}
                        onChange={(e) => onChange(field.key, String(e.target.checked))}
                        disabled={readOnly}
                        className="text-primary-600"
                      />
                      {field.label}
                    </label>
                  </div>
                )
              }

              // text / number
              return (
                <div key={field.key} className={cls}>
                  <label className="mb-1 block text-xs font-medium text-gray-500">
                    {field.label}{field.required && <span className="text-red-500"> *</span>}
                  </label>
                  {readOnly ? (
                    <p className="text-sm">{value || '-'}</p>
                  ) : (
                    <input
                      type={field.inputType === 'number' ? 'number' : 'text'}
                      value={value}
                      onChange={(e) => onChange(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      required={field.required}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
