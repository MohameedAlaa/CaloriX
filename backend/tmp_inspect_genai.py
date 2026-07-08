import importlib, inspect, pkgutil, sys

print('PYTHON', sys.version)

try:
    import google.generativeai as genai
    print('genai_version:', getattr(genai, '__version__', 'unknown'))
    print('genai dir sample:', [n for n in dir(genai) if not n.startswith('_')][:50])
except Exception as e:
    print('IMPORT_GENAI_ERR', repr(e))

# inspect google.generativeai.types
try:
    types = importlib.import_module('google.generativeai.types')
    print('\nMODULE google.generativeai.types found')
    names = [n for n in dir(types) if not n.startswith('_')]
    print('types exports:', names)
    for name in ['FunctionDeclaration','Schema','Type','Tool']:
        print(name, '->', getattr(types, name, None))
except Exception as e:
    print('\nTYPES_MODULE_ERR', repr(e))

# inspect protos
try:
    protos = importlib.import_module('google.generativeai.protos')
    print('\nMODULE google.generativeai.protos found')
    submods = [m.name for m in pkgutil.iter_modules(protos.__path__)]
    print('protos submodules:', submods)
    # try to import schema proto
    try:
        schema_pb2 = importlib.import_module('google.generativeai.protos.schema_pb2')
        print('schema_pb2 fields:', [f.name for f in schema_pb2.Schema.DESCRIPTOR.fields])
        print('schema_pb2.EnumDescriptor for Type:', getattr(schema_pb2, 'Type', None))
    except Exception as e:
        print('schema_pb2 import error', repr(e))
except Exception as e:
    print('\nPROTOS_MODULE_ERR', repr(e))

# try import convenience symbols
try:
    from google.generativeai.types import FunctionDeclaration, Schema, Type
    print('\nImported FunctionDeclaration, Schema, Type successfully')
    print('FunctionDeclaration signature:', inspect.signature(FunctionDeclaration))
    print('Schema class repr:', Schema)
    # attempt to build a minimal Schema instance
    try:
        s = Schema(type=Type.OBJECT, properties={})
        print('Created Schema:', s)
    except Exception as e:
        print('Error constructing Schema object:', repr(e))
except Exception as e:
    print('\nIMPORT_NAMES_ERR')
    import traceback; traceback.print_exc()

# try alternate symbol names
alts = ['Tool', 'ToolSpec', 'ToolSchema', 'Function', 'FunctionSpec']
for a in alts:
    try:
        mod = importlib.import_module('google.generativeai.types')
        print(f'Alternative {a}:', getattr(mod, a, None))
    except Exception:
        pass

print('\nINSPECTION COMPLETE')
