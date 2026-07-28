import json,sys
def res(j):
    r=j.get('resources',{}); out=[]
    if isinstance(r,dict):
        for k in r:
            v=r[k]
            if isinstance(v,list):
                for x in v:
                    out.append((x.get('title') or x.get('name')) if isinstance(x,dict) else str(x))
    return [x for x in out if x not in ('title','url','note')]
for f in sys.argv[1:]:
    j=json.load(open(f))
    print('='*70)
    print('FILE:',f)
    for k in ['title','role','level','day','summary']:
        print(k.upper(),':',j.get(k))
    print('TOPICS:',j.get('topics'))
    print('SKILLS:',j.get('skills_gained'))
    for k in ['practical_task_reference','mini_project_reference','assignment_reference']:
        print(k,':',json.dumps(j.get(k))[:600])
    print('RESOURCES:',res(j)[:10])
