import re

def patch_file(filepath, replacements):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    for search, replace in replacements:
        content = content.replace(search, replace)
        
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

app_replacements = [
    # Remove ambient background blobs
    ('      {/* Premium Ambient Background */}\n      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10 mix-blend-multiply dark:mix-blend-screen opacity-70 dark:opacity-40 transition-opacity duration-500">\n        <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] rounded-full bg-blue-400/30 dark:bg-blue-600/30 blur-[120px] animate-pulse" style={{ animationDuration: \'8s\' }}></div>\n        <div className="absolute top-[10%] -right-[10%] w-[60%] h-[60%] rounded-full bg-cyan-400/30 dark:bg-cyan-600/30 blur-[120px] animate-pulse" style={{ animationDuration: \'12s\', animationDelay: \'2s\' }}></div>\n        <div className="absolute -bottom-[20%] left-[20%] w-[80%] h-[80%] rounded-full bg-blue-300/30 dark:bg-blue-800/30 blur-[120px] animate-pulse" style={{ animationDuration: \'10s\', animationDelay: \'4s\' }}></div>\n      </div>\n', ''),
    # Remove glassmorphism from nav
    ('bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl px-4 py-3', 'bg-white dark:bg-zinc-900 px-4 py-3 border-b border-gray-200 dark:border-zinc-800 shadow-sm'),
    ('border-b border-gray-200/50 dark:border-zinc-800/50 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl px-4 py-3', 'bg-white dark:bg-zinc-900 px-4 py-3 border-b border-gray-200 dark:border-zinc-800 shadow-sm'),
    # Add font-display to logo
    ('<p className="font-bold text-xl tracking-tight hidden sm:block">', '<p className="font-display font-bold text-xl tracking-tight hidden sm:block">')
]
patch_file('src/App.jsx', app_replacements)

login_replacements = [
    # Remove blobs
    ('        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-purple-500/30 rounded-full blur-[100px] mix-blend-multiply dark:mix-blend-screen animate-blob"></div>\n', ''),
    ('        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-500/30 rounded-full blur-[100px] mix-blend-multiply dark:mix-blend-screen animate-blob animation-delay-2000"></div>\n', ''),
    ('        <div className="absolute top-[40%] left-[20%] w-72 h-72 bg-cyan-500/30 rounded-full blur-[100px] mix-blend-multiply dark:mix-blend-screen animate-blob animation-delay-4000"></div>\n', ''),
    # Remove glassmorphism from card
    ('bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-white/20 dark:border-zinc-800/50 shadow-2xl rounded-3xl', 'bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 shadow-xl rounded-2xl'),
    # Add font-display to headings
    ('<h1 className="text-3xl font-bold bg-gradient-to-br from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">', '<h1 className="text-3xl font-display font-bold text-gray-900 dark:text-white">'),
    ('<h2 className="text-xl font-bold bg-gradient-to-br from-blue-600 to-cyan-500 bg-clip-text text-transparent">', '<h2 className="text-xl font-display font-bold text-blue-600 dark:text-blue-400">')
]
patch_file('src/pages/Login.jsx', login_replacements)

welcome_replacements = [
    ('className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"', 'className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4"'),
    ('className="w-full max-w-lg bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border border-white/20 dark:border-zinc-800/50 rounded-3xl shadow-2xl overflow-hidden relative"', 'className="w-full max-w-lg bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden relative"'),
    ('          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] -z-10 mix-blend-multiply dark:mix-blend-screen"></div>\n', ''),
    ('          <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-[80px] -z-10 mix-blend-multiply dark:mix-blend-screen"></div>\n', ''),
    ('<h2 className="text-2xl font-bold bg-gradient-to-br from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">', '<h2 className="text-2xl font-display font-bold text-gray-900 dark:text-white">')
]
patch_file('src/components/WelcomeModal.jsx', welcome_replacements)

dataentry_replacements = [
    ('className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"', 'className="fixed inset-0 z-[100] bg-black/60"')
]
patch_file('src/components/DataEntryModal.jsx', dataentry_replacements)

print("Patched successfully")
