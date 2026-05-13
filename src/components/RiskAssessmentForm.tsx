import { useState, useRef } from 'react';
import { FileText, Download, Printer, Eye, Calendar, User, MapPin } from 'lucide-react';
import type { RiskAssessment } from '../types';
import { HAZARD_CATEGORIES, PROBABILITY_LABELS, SEVERITY_LABELS, RISK_CATEGORY_LABELS, getRiskColor } from '../types';

interface Props {
  assessments: RiskAssessment[];
}

export function RiskAssessmentForm({ assessments }: Props) {
  const [selectedAssessment, setSelectedAssessment] = useState<RiskAssessment | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>რისკის შეფასების ფორმა</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th, td { border: 1px solid #333; padding: 8px; text-align: left; }
          th { background-color: #f0f0f0; }
          .header { text-align: center; margin-bottom: 20px; }
          .risk-critical { background-color: #dc2626; color: white; }
          .risk-high { background-color: #f97316; color: white; }
          .risk-medium { background-color: #eab308; color: black; }
          .risk-low { background-color: #22c55e; color: white; }
          .section-title { background-color: #1e293b; color: white; padding: 10px; margin-top: 20px; }
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        ${printContent.innerHTML}
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleDownloadPDF = () => {
    // For now, use print to PDF functionality
    handlePrint();
  };

  const getRiskClass = (rating: number) => {
    if (rating >= 15) return 'risk-critical';
    if (rating >= 9) return 'risk-high';
    if (rating >= 5) return 'risk-medium';
    return 'risk-low';
  };

  const getRiskBgColor = (rating: number) => {
    if (rating >= 15) return 'bg-red-600';
    if (rating >= 9) return 'bg-orange-500';
    if (rating >= 5) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
          რისკის შეფასების ფორმები
        </h2>

        {assessments.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl text-slate-400 mb-2">ფორმები არ არის</h3>
            <p className="text-slate-500">ჯერ დაამატეთ საფრთხეები "საფრთხეები" განყოფილებაში</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assessments.map(assessment => (
              <div
                key={assessment.id}
                onClick={() => setSelectedAssessment(assessment)}
                className="bg-slate-700/50 rounded-xl p-4 border border-slate-600 cursor-pointer hover:border-amber-500 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <h4 className="text-white font-semibold">{assessment.hazard.name}</h4>
                  <span className={`px-2 py-1 rounded text-xs text-white ${getRiskBgColor(assessment.initialRisk.rating)}`}>
                    {assessment.initialRisk.rating}
                  </span>
                </div>
                <p className="text-slate-400 text-sm mb-3 line-clamp-2">{assessment.hazard.description}</p>
                <div className="flex items-center justify-between text-slate-500 text-xs">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(assessment.createdAt).toLocaleDateString('ka-GE')}
                  </div>
                  <div className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {assessment.responsiblePerson || 'არ არის მითითებული'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Form Preview Modal */}
      {selectedAssessment && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Actions */}
            <div className="sticky top-0 bg-slate-800 p-4 flex items-center justify-between rounded-t-2xl">
              <h3 className="text-white font-bold">რისკის შეფასების ფორმა</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  ბეჭდვა
                </button>
                <button
                  onClick={handleDownloadPDF}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-lg hover:shadow-lg transition-all"
                >
                  <Download className="w-4 h-4" />
                  PDF ჩამოტვირთვა
                </button>
                <button
                  onClick={() => setSelectedAssessment(null)}
                  className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                >
                  დახურვა
                </button>
              </div>
            </div>

            {/* Form Content */}
            <div ref={printRef} className="p-8 bg-white text-black">
              <div className="header text-center mb-8">
                <h1 className="text-2xl font-bold mb-2">რისკის შეფასების ფორმა</h1>
                <p className="text-gray-600">საქართველოს კანონმდებლობის შესაბამისად</p>
                <p className="text-sm text-gray-500 mt-2">
                  თარიღი: {new Date(selectedAssessment.createdAt).toLocaleDateString('ka-GE')}
                </p>
              </div>

              <table className="w-full border-collapse mb-6">
                <tbody>
                  <tr>
                    <th className="bg-gray-100 border border-gray-300 p-3 text-left w-1/3">საფრთხის დასახელება</th>
                    <td className="border border-gray-300 p-3">{selectedAssessment.hazard.name}</td>
                  </tr>
                  <tr>
                    <th className="bg-gray-100 border border-gray-300 p-3 text-left">კატეგორია</th>
                    <td className="border border-gray-300 p-3">{HAZARD_CATEGORIES[selectedAssessment.hazard.category]}</td>
                  </tr>
                  <tr>
                    <th className="bg-gray-100 border border-gray-300 p-3 text-left">საფრთხის აღწერა</th>
                    <td className="border border-gray-300 p-3">{selectedAssessment.hazard.description}</td>
                  </tr>
                  <tr>
                    <th className="bg-gray-100 border border-gray-300 p-3 text-left">ადგილმდებარეობა</th>
                    <td className="border border-gray-300 p-3">{selectedAssessment.hazard.location || '-'}</td>
                  </tr>
                  <tr>
                    <th className="bg-gray-100 border border-gray-300 p-3 text-left">პირთა წრე</th>
                    <td className="border border-gray-300 p-3">{selectedAssessment.affectedPersons.join(', ')}</td>
                  </tr>
                  <tr>
                    <th className="bg-gray-100 border border-gray-300 p-3 text-left">დაშავების/დაზიანების ტიპი</th>
                    <td className="border border-gray-300 p-3">{selectedAssessment.damageType}</td>
                  </tr>
                </tbody>
              </table>

              <h2 className="section-title bg-slate-800 text-white p-3 rounded mb-4 font-bold">არსებული კონტროლის ზომები</h2>
              <ul className="list-disc list-inside mb-6 pl-4">
                {selectedAssessment.existingControls.map((control, i) => (
                  <li key={i} className="mb-1">{control}</li>
                ))}
              </ul>

              <h2 className="section-title bg-slate-800 text-white p-3 rounded mb-4 font-bold">საწყისი რისკის შეფასება</h2>
              <table className="w-full border-collapse mb-6">
                <thead>
                  <tr>
                    <th className="bg-gray-100 border border-gray-300 p-3">ალბათობა (ა)</th>
                    <th className="bg-gray-100 border border-gray-300 p-3">შედეგი (შ)</th>
                    <th className="bg-gray-100 border border-gray-300 p-3">რეიტინგი (რ)</th>
                    <th className="bg-gray-100 border border-gray-300 p-3">კატეგორია</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 p-3 text-center">
                      {selectedAssessment.initialRisk.probability} - {PROBABILITY_LABELS[selectedAssessment.initialRisk.probability]}
                    </td>
                    <td className="border border-gray-300 p-3 text-center">
                      {selectedAssessment.initialRisk.severity} - {SEVERITY_LABELS[selectedAssessment.initialRisk.severity]}
                    </td>
                    <td className={`border border-gray-300 p-3 text-center font-bold ${getRiskClass(selectedAssessment.initialRisk.rating)}`}>
                      {selectedAssessment.initialRisk.rating}
                    </td>
                    <td className={`border border-gray-300 p-3 text-center font-bold ${getRiskClass(selectedAssessment.initialRisk.rating)}`}>
                      {RISK_CATEGORY_LABELS[selectedAssessment.initialRisk.category]}
                    </td>
                  </tr>
                </tbody>
              </table>

              <h2 className="section-title bg-slate-800 text-white p-3 rounded mb-4 font-bold">დამატებითი კონტროლის ზომები</h2>
              <ul className="list-disc list-inside mb-6 pl-4">
                {selectedAssessment.additionalControls.map((control, i) => (
                  <li key={i} className="mb-1">{control}</li>
                ))}
              </ul>

              <h2 className="section-title bg-slate-800 text-white p-3 rounded mb-4 font-bold">ნარჩენი რისკის შეფასება</h2>
              <table className="w-full border-collapse mb-6">
                <thead>
                  <tr>
                    <th className="bg-gray-100 border border-gray-300 p-3">ალბათობა (ა)</th>
                    <th className="bg-gray-100 border border-gray-300 p-3">შედეგი (შ)</th>
                    <th className="bg-gray-100 border border-gray-300 p-3">რეიტინგი (რ)</th>
                    <th className="bg-gray-100 border border-gray-300 p-3">კატეგორია</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 p-3 text-center">
                      {selectedAssessment.residualRisk.probability} - {PROBABILITY_LABELS[selectedAssessment.residualRisk.probability]}
                    </td>
                    <td className="border border-gray-300 p-3 text-center">
                      {selectedAssessment.residualRisk.severity} - {SEVERITY_LABELS[selectedAssessment.residualRisk.severity]}
                    </td>
                    <td className={`border border-gray-300 p-3 text-center font-bold ${getRiskClass(selectedAssessment.residualRisk.rating)}`}>
                      {selectedAssessment.residualRisk.rating}
                    </td>
                    <td className={`border border-gray-300 p-3 text-center font-bold ${getRiskClass(selectedAssessment.residualRisk.rating)}`}>
                      {RISK_CATEGORY_LABELS[selectedAssessment.residualRisk.category]}
                    </td>
                  </tr>
                </tbody>
              </table>

              <h2 className="section-title bg-slate-800 text-white p-3 rounded mb-4 font-bold">პასუხისმგებლობა და ვადები</h2>
              <table className="w-full border-collapse mb-6">
                <tbody>
                  <tr>
                    <th className="bg-gray-100 border border-gray-300 p-3 text-left w-1/3">პასუხისმგებელი პირი</th>
                    <td className="border border-gray-300 p-3">{selectedAssessment.responsiblePerson || '-'}</td>
                  </tr>
                  <tr>
                    <th className="bg-gray-100 border border-gray-300 p-3 text-left">შესრულების ვადა</th>
                    <td className="border border-gray-300 p-3">
                      {selectedAssessment.deadline ? new Date(selectedAssessment.deadline).toLocaleDateString('ka-GE') : '-'}
                    </td>
                  </tr>
                  <tr>
                    <th className="bg-gray-100 border border-gray-300 p-3 text-left">გადახედვის თარიღი</th>
                    <td className="border border-gray-300 p-3">
                      {selectedAssessment.reviewDate ? new Date(selectedAssessment.reviewDate).toLocaleDateString('ka-GE') : '-'}
                    </td>
                  </tr>
                </tbody>
              </table>

              <div className="mt-12 grid grid-cols-2 gap-8">
                <div>
                  <p className="border-t border-gray-400 pt-2 text-center">შემფასებლის ხელმოწერა</p>
                </div>
                <div>
                  <p className="border-t border-gray-400 pt-2 text-center">თარიღი</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
