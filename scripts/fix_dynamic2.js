const fs = require('fs');

const files = [
  'C:/Users/Bizcochito/Downloads/TeleBridge/src/app/api/bots/[id]/route.ts',
  'C:/Users/Bizcochito/Downloads/TeleBridge/src/app/api/bots/[id]/duplicate/route.ts',
  'C:/Users/Bizcochito/Downloads/TeleBridge/src/app/api/bots/[id]/endpoints/route.ts',
  'C:/Users/Bizcochito/Downloads/TeleBridge/src/app/api/bots/[id]/endpoints/[endpointId]/route.ts',
  'C:/Users/Bizcochito/Downloads/TeleBridge/src/app/api/bots/[id]/messages/route.ts',
  'C:/Users/Bizcochito/Downloads/TeleBridge/src/app/api/bots/[id]/stats/route.ts',
  'C:/Users/Bizcochito/Downloads/TeleBridge/src/app/api/bots/[id]/webhook/route.ts'
];

files.forEach(f => {
  if (fs.existsSync(f)) {
    let content = fs.readFileSync(f, 'utf8');
    if (content.startsWith("export const dynamic = 'force-dynamic';\n")) {
      content = content.replace("export const dynamic = 'force-dynamic';\n", "");
      const lines = content.split('\n');
      let lastImportIdx = -1;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('import ')) {
          lastImportIdx = i;
        }
      }
      lines.splice(lastImportIdx + 1, 0, "\nexport const dynamic = 'force-dynamic';\n");
      fs.writeFileSync(f, lines.join('\n'));
      console.log('Fixed ' + f);
    }
  }
});
