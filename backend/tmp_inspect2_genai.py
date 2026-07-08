import inspect
from google.generativeai.types import content_types

print('module:', content_types)
print('exports sample:', [n for n in dir(content_types) if not n.startswith('_')][:100])
print('\nFunctionDeclaration:', content_types.FunctionDeclaration)
try:
    print('FunctionDeclaration signature:', inspect.signature(content_types.FunctionDeclaration))
except Exception as e:
    print('sig err', e)

try:
    src = inspect.getsource(content_types.FunctionDeclaration)
    print('\nFunctionDeclaration source:\n', src)
except Exception as e:
    print('getsource failed:', e)

print('\nTool class:', getattr(content_types, 'Tool', None))
try:
    print('Tool signature:', inspect.signature(content_types.Tool))
except Exception as e:
    print('Tool sig err', e)

try:
    print('\nTool source:\n', inspect.getsource(content_types.Tool))
except Exception as e:
    print('getsource Tool failed:', e)
