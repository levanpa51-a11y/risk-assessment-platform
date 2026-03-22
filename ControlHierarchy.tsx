import { ChevronDown, Shield, ArrowDown, Check } from 'lucide-react';
import { CONTROL_TYPES } from '../types';

export function ControlHierarchy() {
  const hierarchySteps = [
    {
      type: 'elimination',
      icon: '🚫',
      color: 'from-emerald-500 to-emerald-600',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500',
      examples: [
        'რისკის შემცველი სამუშაო აქტივობის სრულად გამორიცხვა',
        'შრომითი პროცესის ცვლილება',
        'საფრთხის წყაროს მოხსნა'
      ],
      effectiveness: 100
    },
    {
      type: 'substitution',
      icon: '🔄',
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500',
      examples: [
        'საფრთხის მოდიფიცირება',
        'შრომითი პროცესის ცვლილება',
        'დამატებითი საინჟინრო-ტექნოლოგიური ღონისძიებები',
        'ნაკლებად საშიში მასალის გამოყენება'
      ],
      effectiveness: 80
    },
    {
      type: 'engineering',
      icon: '⚙️',
      color: 'from-violet-500 to-violet-600',
      bgColor: 'bg-violet-500/10',
      borderColor: 'border-violet-500',
      examples: [
        'ადამიანების საფრთხის წყაროსთან კონტაქტის პრევენცია',
        'საფრთხის იზოლირება',
        'საფრთხის მიუწვდომელ ადგილზე განთავსება',
        'ვენტილაციის სისტემა',
        'დამცავი ბარიერები'
      ],
      effectiveness: 60
    },
    {
      type: 'administrative',
      icon: '📋',
      color: 'from-amber-500 to-amber-600',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500',
      examples: [
        'წესებისა და პროცედურების კრებული',
        'სამუშაო ნებართვის სისტემა',
        'მოწყობილობების ოპერირების ინსტრუქციები',
        'ტრენინგები და სწავლება',
        'როტაცია და დასვენების რეჟიმი'
      ],
      effectiveness: 40
    },
    {
      type: 'ppe',
      icon: '🦺',
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-500/10',
      borderColor: 'border-orange-500',
      examples: [
        'ფეხსაცმელი',
        'ტანსაცმელი',
        'თავსაბურავები',
        'ხელთათმანები',
        'სათვალეები',
        'რესპირატორები',
        'სმენის დამცავი საშუალებები'
      ],
      effectiveness: 20
    }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
        <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
          <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
          კონტროლის იერარქია
        </h2>
        <p className="text-slate-400 mb-6">
          საკონტროლო ღონისძიებების განსაზღვრისას დამსაქმებელი ვალდებულია იხელმძღვანელოს კონტროლის იერარქიით -
          დაღმავალი მიმართულებით უპირატესი საკონტროლო ღონისძიებიდან ბოლო საფეხურამდე.
        </p>

        <div className="relative">
          {/* Hierarchy Steps */}
          <div className="space-y-4">
            {hierarchySteps.map((step, index) => (
              <div key={step.type}>
                <div className={`relative p-6 rounded-2xl border-2 ${step.borderColor} ${step.bgColor} transition-all hover:scale-[1.02]`}>
                  {/* Priority Badge */}
                  <div className={`absolute -top-3 -left-3 w-10 h-10 bg-gradient-to-br ${step.color} rounded-full flex items-center justify-center text-white font-bold shadow-lg`}>
                    {index + 1}
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="text-4xl">{step.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold text-white">
                          {CONTROL_TYPES[step.type as keyof typeof CONTROL_TYPES].label}
                        </h3>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400 text-sm">ეფექტურობა:</span>
                          <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full bg-gradient-to-r ${step.color}`}
                              style={{ width: `${step.effectiveness}%` }}
                            ></div>
                          </div>
                          <span className="text-white font-semibold">{step.effectiveness}%</span>
                        </div>
                      </div>
                      <p className="text-slate-400 mt-1">
                        {CONTROL_TYPES[step.type as keyof typeof CONTROL_TYPES].description}
                      </p>

                      <div className="mt-4">
                        <h4 className="text-slate-300 font-medium mb-2">მაგალითები:</h4>
                        <ul className="grid md:grid-cols-2 gap-2">
                          {step.examples.map((example, i) => (
                            <li key={i} className="flex items-start gap-2 text-slate-400 text-sm">
                              <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                              {example}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Arrow */}
                {index < hierarchySteps.length - 1 && (
                  <div className="flex justify-center py-2">
                    <ArrowDown className="w-6 h-6 text-slate-600" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Important Note */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <Shield className="w-8 h-8 text-amber-500 flex-shrink-0" />
          <div>
            <h3 className="text-amber-400 font-bold text-lg mb-2">მნიშვნელოვანი!</h3>
            <p className="text-slate-300">
              რისკის კონტროლის შესაბამისი იერარქიის არჩევისას, არსებული სამუშაო გარემოს სპეციფიკისა და
              თავისებურებებიდან გამომდინარე დამსაქმებელმა <strong className="text-white">პრიორიტეტი უნდა მიანიჭოს
              კონტროლის იერარქიის პირველ საფეხურს (საფრთხის აღმოფხვრა)</strong>, ხოლო დასაბუთებული
              ტექნოლოგიური მიზეზების გამო, თუ ვერ ხერხდება კონტროლის იერარქიის სრული დაცვა,
              იხელმძღვანელოს დაღმავალი მიმართულებით უპირატესი საკონტროლო ღონისძიებიდან ბოლო საფეხურამდე.
            </p>
            <p className="text-slate-400 mt-4">
              <strong className="text-amber-400">ინდივიდუალური დაცვის საშუალებები</strong> გამოყენებულ უნდა იქნეს
              მხოლოდ იმ შემთხვევაში, როცა დასაბუთებული ტექნოლოგიური მიზეზების გამო, დამსაქმებელი ვერ ახერხებს
              სამუშაო ადგილებზე უსაფრთხოების ნორმების დაცვას სრული მოცულობით კონტროლის იერარქიის გათვალისწინებით.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
