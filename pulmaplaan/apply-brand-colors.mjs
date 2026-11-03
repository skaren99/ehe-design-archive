import fs from 'node:fs';
// Palette from EHE Events dist/style.css. Keep the prototype's layout and typography.
const groups={
 '#faf8f4':['#f8f7f3','#fafbf7','#fbfbf8','#f4f5ed','#fffdfa'],
 '#382d32':['#293d32'],
 '#452b39':['#30483b','#314735','#344b3e','#385340','#2e4635','#2f4937','#44613c'],
 '#72666b':['#778078','#697267','#77806f','#7c847b','#7c8776','#718068','#728267','#75816e','#68785f','#85907f','#728169','#7e8975','#819075','#87907f','#87947a','#899b80','#8a7f66','#93816c','#969d90'],
 '#634052':['#617854','#6e8560','#7c8e6a','#7c8f6d','#77634f'],
 '#9a7986':['#5f7952','#839578','#839a70','#8e957f','#94a083','#9ba28f','#9ba490','#9caa90','#9cae8b','#a3b197','#b38b53','#82986c','#9ba78f'],
 '#ad989f':['#a17b4d','#a28b6d','#a58f5e','#ac8571','#b4baad'],
 '#dcd5d1':['#e5e8df','#cbd2c5','#ccd7c1','#dce0d4','#dce1d5','#dce1d6','#dce2d5','#e8ddcc'],
 '#e0d1d7':['#cbd7c3','#b0c0ad','#bac6b3','#becbbb','#c9d3c5'],
 '#eee8e7':['#e9eee3','#e9eee2','#e4eadb','#dfe6d9','#e3e8da','#e7ebdf','#edf0e6','#f2f4ed','#f0f1e9'],
 '#f3eeed':['#edf1e9','#edf0e7','#eeeadd','#eef0e9','#eff2e9','#eff2eb','#f3f1ea','#f6f7f2','#edf0e9','#f0ede4'],
 '#e8dcd5':['#e9ddd0','#f4e9df','#f4eee5','#eee9db','#f2e3dc'],
 '#f6efea':['#f7f2e9','#f7ece3','#f9eee5'],
 '#8a5d47':['#9a7154','#9d7559','#a27044','#9d5a3d'],
 '#a15643':['#a15643'],
 '#f9eae5':['#f9eae5'],
 '#725360':['#506253'],
 '#271c2455':['#20302455'],
 '#271c2415':['#20302415']
};
const mapping=Object.fromEntries(Object.entries(groups).flatMap(([target,values])=>values.map(v=>[v,target])));
for(const file of ['dist/index.html','admin.css','build-admin.mjs','update-client.mjs']){
 const source=fs.readFileSync(file,'utf8');
 fs.writeFileSync(file,source.replace(/#[0-9a-fA-F]{3,8}\b/g,color=>mapping[color.toLowerCase()]||color));
}
console.log('Applied EHE Events palette to client and admin source.');
