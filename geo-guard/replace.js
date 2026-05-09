const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'components');
const appDir = path.join(__dirname, 'app');

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // Replace Panel classes
  content = content.replace(/bg-slate-900/g, "bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-soft)] hover:border-[var(--border-strong)] transition-all");
  content = content.replace(/bg-slate-950/g, "bg-[var(--bg)] border border-[var(--border)]");
  
  // Replace Button classes
  content = content.replace(/bg-cyan-300|bg-cyan-400/g, "bg-[var(--brand)] text-[var(--bg)] hover:bg-[var(--brand-strong)] transition-all border border-transparent");
  content = content.replace(/bg-white/g, "bg-[var(--surface)] text-[var(--heading)] border border-[var(--border)] hover:bg-[var(--surface-strong)] hover:border-[var(--border-strong)] transition-all");
  content = content.replace(/bg-amber-300|bg-amber-400/g, "bg-[var(--surface)] text-[var(--heading)] border border-[var(--border)] hover:bg-[var(--surface-strong)] hover:border-[var(--border-strong)] transition-all");
  content = content.replace(/bg-red-600/g, "bg-[var(--danger)] text-white border border-transparent hover:opacity-90 transition-all");
  
  // Replace Text utility colors
  content = content.replace(/text-slate-200|text-slate-300|text-slate-100/g, "text-[var(--text)]");
  content = content.replace(/text-slate-400|text-slate-500/g, "text-[var(--text-muted)]");
  content = content.replace(/text-cyan-200|text-cyan-300/g, "text-[var(--heading)]");
  content = content.replace(/text-emerald-200|text-emerald-300/g, "text-[var(--accent)]");
  content = content.replace(/text-amber-100|text-amber-300/g, "text-[var(--warning)]");
  content = content.replace(/text-red-100|text-red-300/g, "text-[var(--danger)]");
  content = content.replace(/text-white/g, "text-[var(--heading)]");
  content = content.replace(/text-slate-950/g, "text-[var(--bg)]");

  fs.writeFileSync(filePath, content);
}

function processDirectory(directory) {
  const files = fs.readdirSync(directory);
  for (const file of files) {
    const fullPath = path.join(directory, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.js')) {
      replaceInFile(fullPath);
    }
  }
}

processDirectory(dir);
processDirectory(appDir);
console.log("Done replacing classes.");
