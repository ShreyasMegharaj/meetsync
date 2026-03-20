const fs = require('fs');
const path = require('path');

const filesToProcess = [
  'client/src/pages/ChatPage.jsx',
  'client/src/pages/LoginPage.jsx',
  'client/src/pages/RegisterPage.jsx',
  'client/src/pages/DashboardPage.jsx',
  'client/src/pages/ProfilePage.jsx'
];

filesToProcess.forEach(file => {
  const fullPath = path.resolve(__dirname, file);
  if (!fs.existsSync(fullPath)) return;

  let content = fs.readFileSync(fullPath, 'utf8');

  // 1. Remove MagneticCursor component entirely
  content = content.replace(/\/\*\s*───\s*Magnetic Cursor\s*───\s*\*\/[\s\S]*?const MagneticCursor = [\s\S]*?return \([\s\S]*?\);\s*};\n/g, '');
  content = content.replace(/\/\* ═══════════════════════════════════════════════════════════════\s*MAGNETIC CURSOR.*?═══════════════════════════════════════════════════════════════ \*\/\s*const MagneticCursor = [\s\S]*?return \([\s\S]*?\);\s*};\n/g, '');
  
  // Also remove its usage
  content = content.replace(/<MagneticCursor \/>/g, '');

  // 2. Simplify Background components
  content = content.replace(/\/\* ═══════════════════════════════════════════════════════════════\s*(?:AMBIENT )?BACKGROUND.*?\s*═══════════════════════════════════════════════════════════════ \*\/\s*(?:const [\s\S]*?)?const Background = \(\) => \([\s\S]*?<\/div>\s*\);/g, `/* ═══════════════════════════════════════════════════════════════
   BACKGROUND
   ═══════════════════════════════════════════════════════════════ */
const Background = () => (
  <div className="fixed inset-0 overflow-hidden bg-[#030108]" style={{ zIndex: 0 }}>
    <div className="absolute inset-0" style={{ background: "linear-gradient(145deg, #050208 0%, #0a0618 30%, #0d0a1a 50%, #06050f 70%, #020104 100%)" }} />
    <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 25% 15%, rgba(109,40,217,0.07) 0%, transparent 55%)" }} />
    <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 75% 85%, rgba(59,130,246,0.05) 0%, transparent 55%)" }} />
    <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(236,72,153,0.03) 0%, transparent 50%)" }} />
  </div>
);`);

  // 3. Lower Framer Motion Durations
  content = content.replace(/duration:\s*[\d.]+/g, 'duration: 0.2');
  
  // 4. Lower Tailwind Duration classes
  content = content.replace(/duration-(300|400|500|600|700|1000)/g, 'duration-200');

  // 5. Remove 'repeat: Infinity' to stop continuous animations
  content = content.replace(/repeat:\s*Infinity,?/g, '');

  // 6. Fix ChatPage mobile layout
  if (file.includes('ChatPage.jsx')) {
    content = content.replace(/className="relative h-screen overflow-hidden"/g, 'className="relative h-[100dvh] overflow-hidden"');
    content = content.replace(/className="relative z-10 flex flex-col h-screen"/g, 'className="relative z-10 flex flex-col h-[100dvh]"');
  }

  // Also remove shimmering from login/register logo which can be heavy
  content = content.replace(/<motion\.div className="absolute -inset-4 rounded-\[40px\]"[\s\S]*?<\/motion\.div>/g, '');
  content = content.replace(/<motion\.div className="absolute -inset-\[1px\] rounded-\[30px\] overflow-hidden"[\s\S]*?<\/motion\.div>/g, '');
  content = content.replace(/<motion\.div className="absolute inset-0 rounded-\[28px\] overflow-hidden pointer-events-none"[\s\S]*?<\/motion\.div>/g, '');

  fs.writeFileSync(fullPath, content);
  console.log(`Processed ${file}`);
});
