const fs = require('fs');
const files = [
  'e:/work/taskflow-studio/src/contexts/TaskContext.tsx',
  'e:/work/taskflow-studio/src/components/drawers/PptTaskDrawer.tsx',
  'e:/work/taskflow-studio/src/components/task/PptTaskDetail.tsx',
  'e:/work/taskflow-studio/src/pages/TaskCreate.tsx',
  'e:/work/taskflow-studio/src/pages/TodoCenter.tsx'
];
for(let file of files) {
  let content = fs.readFileSync(file, 'utf-8');
  if(!content.includes('formatPageRange')) {
    if(content.includes('import { cn } from "@/lib/utils"')) {
      content = content.replace('import { cn } from "@/lib/utils"', 'import { cn, formatPageRange } from "@/lib/utils"');
    } else {
        content = 'import { formatPageRange } from "@/lib/utils";\n' + content;
    }
  }
  content = content.replace(/([a-zA-Z0-9_\.]+(?:\?.+?)?)\.pages\.join\((?:'[^']*'|"[^"]*")\)/g, 'formatPageRange($1.pages)');
  content = content.replace(/remainingPages\.join\((?:'[^']*'|"[^"]*")\)/g, 'formatPageRange(remainingPages)');
  content = content.replace(/conflictPages\.join\((?:'[^']*'|"[^"]*")\)/g, 'formatPageRange(conflictPages)');
  fs.writeFileSync(file, content, 'utf-8');
  console.log('Fixed', file);
}
