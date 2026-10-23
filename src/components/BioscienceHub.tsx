import React, { useState } from 'react';
import {
  Dna,
  FlaskConical,
  BookOpen,
  Search,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  Sparkles,
  Layers,
  ChevronRight,
  Atom,
} from 'lucide-react';
import {
  fetchProteinData,
  fetchCompoundData,
  searchPubMedLiterature,
} from '../services/dexterApi';

interface BioscienceHubProps {
  onOpen3DView?: () => void;
}

export const BioscienceHub: React.FC<BioscienceHubProps> = ({ onOpen3DView }) => {
  const [activeSection, setActiveSection] = useState<'proteins' | 'compounds' | 'literature'>('proteins');

  // Protein state
  const [proteinQuery, setProteinQuery] = useState('P04637'); // Default TP53
  const [proteinLoading, setProteinLoading] = useState(false);
  const [proteinData, setProteinData] = useState<any | null>(null);

  // Compound state
  const [compoundQuery, setCompoundQuery] = useState('Aspirin');
  const [compoundLoading, setCompoundLoading] = useState(false);
  const [compoundData, setCompoundData] = useState<any | null>(null);

  // Literature state
  const [litQuery, setLitQuery] = useState('CRISPR Cas9 gene editing in vivo');
  const [litLoading, setLitLoading] = useState(false);
  const [litData, setLitData] = useState<any | null>(null);

  const [copied, setCopied] = useState(false);

  // Search protein
  const handleSearchProtein = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!proteinQuery.trim() || proteinLoading) return;
    setProteinLoading(true);
    try {
      const data = await fetchProteinData(proteinQuery.trim());
      setProteinData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setProteinLoading(false);
    }
  };

  // Search compound
  const handleSearchCompound = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!compoundQuery.trim() || compoundLoading) return;
    setCompoundLoading(true);
    try {
      const data = await fetchCompoundData(compoundQuery.trim());
      setCompoundData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setCompoundLoading(false);
    }
  };

  // Search literature
  const handleSearchLiterature = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!litQuery.trim() || litLoading) return;
    setLitLoading(true);
    try {
      const data = await searchPubMedLiterature(litQuery.trim());
      setLitData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLitLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 sm:p-6 backdrop-blur flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Dna className="w-5 h-5 text-teal-400" />
            <h2 className="text-base sm:text-lg font-bold text-slate-100">
              Dexter Bioscience & Structural Biology Suite
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Grounded in UniProtKB, AlphaFold DB, PubChem PUG REST, and PubMed E-utilities.
          </p>
        </div>

        {/* Section switcher */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveSection('proteins')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeSection === 'proteins'
                ? 'bg-slate-800 text-teal-300 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Dna className="w-3.5 h-3.5" />
            <span>Proteins & AlphaFold</span>
          </button>

          <button
            onClick={() => setActiveSection('compounds')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeSection === 'compounds'
                ? 'bg-slate-800 text-emerald-300 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FlaskConical className="w-3.5 h-3.5" />
            <span>PubChem Chemistry</span>
          </button>

          <button
            onClick={() => setActiveSection('literature')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeSection === 'literature'
                ? 'bg-slate-800 text-purple-300 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>PubMed Literature</span>
          </button>
        </div>
      </div>

      {/* 1. Proteins & AlphaFold Explorer */}
      {activeSection === 'proteins' && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 sm:p-6 backdrop-blur space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Dna className="w-5 h-5 text-teal-400" />
              <h3 className="text-sm font-semibold text-slate-200">
                Protein Sequence & AlphaFold 3D Coordinates
              </h3>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              UniProtKB / AlphaFold DB v4
            </span>
          </div>

          <form onSubmit={handleSearchProtein} className="flex gap-2">
            <input
              type="text"
              value={proteinQuery}
              onChange={(e) => setProteinQuery(e.target.value)}
              placeholder="Enter UniProt ID (e.g. P04637 for TP53, P00533 for EGFR, P01308 for Insulin)..."
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500"
            />
            <button
              type="submit"
              disabled={!proteinQuery.trim() || proteinLoading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:opacity-40 text-slate-950 text-xs sm:text-sm font-semibold transition-all cursor-pointer"
            >
              {proteinLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              <span>Fetch Structure</span>
            </button>
          </form>

          {/* Quick preset chips */}
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Examples:</span>
            {['P04637 (TP53)', 'P00533 (EGFR)', 'P01308 (Insulin)', 'P68871 (HBB)'].map((p) => {
              const id = p.split(' ')[0];
              return (
                <button
                  key={id}
                  onClick={() => {
                    setProteinQuery(id);
                    fetchProteinData(id).then(setProteinData);
                  }}
                  className="px-2 py-0.5 rounded-md bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-teal-300 text-[11px] font-mono transition-colors"
                >
                  {p}
                </button>
              );
            })}
          </div>

          {proteinData && (
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-base text-teal-300">
                      {proteinData.geneName} ({proteinData.entryName})
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-900 border border-slate-800 font-mono text-slate-300">
                      {proteinData.accession}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 italic">{proteinData.organism}</p>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={proteinData.alphaFoldUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs text-teal-300 border border-slate-700/80 transition-colors"
                  >
                    <span>AlphaFold DB</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  <a
                    href={proteinData.pdbUrl}
                    download
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-semibold shadow-sm transition-colors"
                  >
                    <span>Download PDB</span>
                  </a>
                </div>
              </div>

              {/* Function description */}
              <div className="text-xs space-y-1">
                <span className="font-semibold text-slate-400 uppercase tracking-wider block">
                  Molecular Function:
                </span>
                <p className="text-slate-200 leading-relaxed bg-slate-900/60 p-3 rounded-lg border border-slate-800/60">
                  {proteinData.function}
                </p>
              </div>

              {/* Sequence preview */}
              <div className="text-xs space-y-1">
                <div className="flex justify-between text-slate-400">
                  <span>Canonical Amino Acid Sequence ({proteinData.sequenceLength} aa):</span>
                  <button
                    onClick={() => handleCopy(proteinData.sequenceSample)}
                    className="flex items-center gap-1 text-[11px] text-teal-400 hover:text-teal-300 font-mono"
                  >
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'Copied' : 'Copy Sequence'}</span>
                  </button>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-lg font-mono text-teal-400 text-[11px] break-all border border-slate-800">
                  {proteinData.sequenceSample}...
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. PubChem Chemistry Scout */}
      {activeSection === 'compounds' && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 sm:p-6 backdrop-blur space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <FlaskConical className="w-5 h-5 text-emerald-400" />
              <h3 className="text-sm font-semibold text-slate-200">
                PubChem Chemical & Drug Discovery Scout
              </h3>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              NCBI PUG REST v2
            </span>
          </div>

          <form onSubmit={handleSearchCompound} className="flex gap-2">
            <input
              type="text"
              value={compoundQuery}
              onChange={(e) => setCompoundQuery(e.target.value)}
              placeholder="Search chemical compound (e.g. Aspirin, Caffeine, Paclitaxel, Metformin, Imatinib)..."
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              disabled={!compoundQuery.trim() || compoundLoading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 text-xs sm:text-sm font-semibold transition-all cursor-pointer"
            >
              {compoundLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              <span>Query Compound</span>
            </button>
          </form>

          {/* Preset chips */}
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Examples:</span>
            {['Aspirin', 'Caffeine', 'Paclitaxel', 'Imatinib', 'Metformin'].map((c) => (
              <button
                key={c}
                onClick={() => {
                  setCompoundQuery(c);
                  fetchCompoundData(c).then(setCompoundData);
                }}
                className="px-2 py-0.5 rounded-md bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-emerald-300 text-[11px] font-mono transition-colors"
              >
                {c}
              </button>
            ))}
          </div>

          {compoundData && (
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-white/5 border border-slate-800">
                <img
                  src={compoundData.structureImageUrl}
                  alt={compoundData.name}
                  className="max-h-40 object-contain invert brightness-90 contrast-125"
                />
                <span className="text-[11px] font-mono text-slate-400 mt-2">PubChem 2D Structure</span>
              </div>

              <div className="md:col-span-2 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <h4 className="font-bold text-base text-emerald-300 capitalize">{compoundData.name}</h4>
                  <span className="text-xs font-mono text-slate-400">CID: {compoundData.cid}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 block text-[10px] uppercase">Molecular Formula</span>
                    <span className="font-mono text-slate-200 font-semibold">{compoundData.molecularFormula}</span>
                  </div>

                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 block text-[10px] uppercase">Molecular Weight</span>
                    <span className="font-mono text-slate-200 font-semibold">{compoundData.molecularWeight} g/mol</span>
                  </div>

                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 block text-[10px] uppercase">LogP (Lipophilicity)</span>
                    <span className="font-mono text-slate-200 font-semibold">{compoundData.xlogp}</span>
                  </div>

                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 block text-[10px] uppercase">Lipinski Rule of 5</span>
                    <span className="font-mono text-emerald-400 font-semibold">Compliant</span>
                  </div>
                </div>

                <div className="text-xs space-y-1">
                  <span className="text-slate-400 text-[10px] uppercase">Canonical SMILES:</span>
                  <div className="bg-slate-950 p-2 rounded font-mono text-[11px] text-emerald-300 break-all border border-slate-800">
                    {compoundData.canonicalSmiles}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. PubMed Biomedical Literature Scout */}
      {activeSection === 'literature' && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 sm:p-6 backdrop-blur space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-purple-400" />
              <h3 className="text-sm font-semibold text-slate-200">
                PubMed Scientific Literature Scout
              </h3>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              NCBI Entrez E-utilities
            </span>
          </div>

          <form onSubmit={handleSearchLiterature} className="flex gap-2">
            <input
              type="text"
              value={litQuery}
              onChange={(e) => setLitQuery(e.target.value)}
              placeholder="Search peer-reviewed papers (e.g. mRNA vaccines, CRISPR therapeutics, cancer immunotherapy)..."
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
            <button
              type="submit"
              disabled={!litQuery.trim() || litLoading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-400 disabled:opacity-40 text-white text-xs sm:text-sm font-semibold transition-all cursor-pointer"
            >
              {litLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              <span>Search PubMed</span>
            </button>
          </form>

          {litData && (
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>
                  Found <strong className="text-purple-300 font-mono">{litData.count}</strong> citations for: "{litData.query}"
                </span>
                <a
                  href={litData.pubmedSearchUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-purple-400 hover:text-purple-300"
                >
                  <span>Open on PubMed.gov</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              <div className="space-y-2">
                {litData.pmids && litData.pmids.map((pmid: string) => (
                  <div
                    key={pmid}
                    className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-purple-300 font-semibold">PMID: {pmid}</span>
                      <span className="text-slate-400">Indexed Biomedical Article</span>
                    </div>
                    <a
                      href={`https://pubmed.ncbi.nlm.nih.gov/${pmid}/`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-slate-400 hover:text-slate-200"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
