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
    if (!content.includes('export const dynamic')) {
      content = "export const dynamic = 'force-dynamic';\n" + content;
      fs.writeFileSync(f, content);
      console.log('Updated ' + f);
    }
  }
});
