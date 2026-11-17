import React, { useMemo, useState } from 'react';
import { Check, Code2, Copy, Database, Search, Utensils } from 'lucide-react';
import { ENGINE_SPEC_TS, SQL_MIGRATION_V05, SQL_MIGRATION_V06 } from '../shared/architectureSpecs';
import { CURATED_FOOD_CATALOG } from '../shared/catalog';

export const ArchitectureSpecsView: React.FC = () => {
  const [foodSearch, setFoodSearch] = useState('');
  const [onlyNoFridge, setOnlyNoFridge] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [sqlVersion, setSqlVersion] = useState<'v06' | 'v05'>('v06');

  const filteredFoods = useMemo(() => {
    return CURATED_FOOD_CATALOG.filter(food => {
      if (onlyNoFridge && food.requiresFridge) return false;
      if (foodSearch.trim()) {
        const q = foodSearch.toLowerCase();
        return (
          food.name.toLowerCase().includes(q) ||
          food.sourceCode.toLowerCase().includes(q) ||
          food.mealGroup.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [foodSearch, onlyNoFridge]);

  const handleCopy = (key: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const activeSql = sqlVersion === 'v06' ? SQL_MIGRATION_V06 : SQL_MIGRATION_V05;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Catálogo Nutricional Curado TACO / IBGE */}
      <section className="bg-white border border-stone-200 rounded-xl p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-200 pb-4">
          <div className="space-y-1">
            <h2 className="text-lg font-serif font-semibold text-stone-900 flex items-center gap-2">
              <Utensils className="w-4 h-4 text-[#03422A]" />
              <span>Catálogo Nutricional Curado (TACO 4ª ed. e Medidas IBGE POF)</span>
            </h2>
            <p className="text-xs text-stone-500">
              Valores ausentes permanecem como N/D (null), nunca zero silencioso. Alimentos já descritos como consumidos.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={foodSearch}
                onChange={e => setFoodSearch(e.target.value)}
                placeholder="Filtrar alimento ou código..."
                className="pl-8 pr-3 py-1.5 rounded-lg border border-stone-300 text-xs w-56"
              />
            </div>
            <label className="flex items-center gap-2 text-xs text-stone-700 cursor-pointer">
              <input
                type="checkbox"
                checked={onlyNoFridge}
                onChange={e => setOnlyNoFridge(e.target.checked)}
              />
              Somente sem geladeira
            </label>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-stone-200 text-stone-500">
                <th className="py-2.5 px-3 font-medium">Alimento e Estado</th>
                <th className="py-2.5 px-3 font-medium">Referência</th>
                <th className="py-2.5 px-3 font-medium">Medida Caseira (IBGE)</th>
                <th className="py-2.5 px-3 font-medium text-right">Energia</th>
                <th className="py-2.5 px-3 font-medium text-right">Prot / Carb / Gord</th>
                <th className="py-2.5 px-3 font-medium text-right">Fibra</th>
                <th className="py-2.5 px-3 font-medium">Alergênicos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200/80 tabular-nums">
              {filteredFoods.map(food => (
                <tr key={food.id} className="hover:bg-stone-50/80">
                  <td className="py-2.5 px-3 font-medium text-stone-900">
                    {food.name}
                    <span className="block text-[11px] font-normal text-stone-500">
                      {food.requiresFridge ? 'Requer refrigeração' : 'Seguro fora da geladeira'} · {food.costTier}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-stone-600">{food.sourceCode}</td>
                  <td className="py-2.5 px-3 text-stone-700">
                    {food.householdMeasure} ({food.portionGrams}g)
                  </td>
                  <td className="py-2.5 px-3 text-right font-semibold text-stone-900">{food.kcal} kcal</td>
                  <td className="py-2.5 px-3 text-right font-mono text-stone-700">
                    {food.protein_g}g / {food.carbs_g}g / {food.fat_g}g
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-stone-600">
                    {food.fiber_g !== null ? `${food.fiber_g}g` : 'N/D'}
                  </td>
                  <td className="py-2.5 px-3 text-stone-600">
                    {food.allergens.length > 0 ? food.allergens.join(', ') : 'Nenhum'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* SQL Migrations & Engine Zod TS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-stone-900 text-stone-100 rounded-xl border border-stone-800 overflow-hidden">
          <div className="px-5 py-3.5 bg-stone-950 border-b border-stone-800 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-400" />
                <span>PostgreSQL Migrations</span>
              </span>
              <div className="flex items-center gap-1 bg-stone-900 p-0.5 rounded-md border border-stone-800 text-[11px]">
                <button
                  type="button"
                  onClick={() => setSqlVersion('v06')}
                  className={`px-2 py-1 rounded ${
                    sqlVersion === 'v06' ? 'bg-stone-800 text-white' : 'text-stone-400'
                  }`}
                >
                  v0.6 (Atual)
                </button>
                <button
                  type="button"
                  onClick={() => setSqlVersion('v05')}
                  className={`px-2 py-1 rounded ${
                    sqlVersion === 'v05' ? 'bg-stone-800 text-white' : 'text-stone-400'
                  }`}
                >
                  v0.5 (Base)
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleCopy('sql', activeSql)}
              className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-xs font-medium text-emerald-300 flex items-center gap-1.5"
            >
              {copiedKey === 'sql' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey === 'sql' ? 'Copiado' : 'Copiar SQL'}</span>
            </button>
          </div>
          <pre className="p-5 text-xs font-mono overflow-x-auto max-h-[520px] text-stone-300 leading-relaxed">
            {activeSql}
          </pre>
        </section>

        <section className="bg-stone-900 text-stone-100 rounded-xl border border-stone-800 overflow-hidden">
          <div className="px-5 py-3.5 bg-stone-950 border-b border-stone-800 flex items-center justify-between">
            <span className="text-xs font-semibold flex items-center gap-2">
              <Code2 className="w-4 h-4 text-sky-400" />
              <span>engine_v0_6_spec.ts (Validação Zod no Servidor)</span>
            </span>
            <button
              type="button"
              onClick={() => handleCopy('ts', ENGINE_SPEC_TS)}
              className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-xs font-medium text-sky-300 flex items-center gap-1.5"
            >
              {copiedKey === 'ts' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey === 'ts' ? 'Copiado' : 'Copiar TypeScript'}</span>
            </button>
          </div>
          <pre className="p-5 text-xs font-mono overflow-x-auto max-h-[520px] text-stone-300 leading-relaxed">
            {ENGINE_SPEC_TS}
          </pre>
        </section>
      </div>
    </div>
  );
};
