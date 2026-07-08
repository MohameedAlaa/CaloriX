import traceback
import google.generativeai as genai

try:
    import app.services.ai_tools as ai_tools
    print('Imported ai_tools OK')
except Exception as e:
    print('Failed to import ai_tools:')
    traceback.print_exc()
    raise SystemExit(1)

try:
    model = genai.GenerativeModel('gemini-2.5-flash', tools=ai_tools.TOOLS)
    print('Created GenerativeModel:', type(model))
except Exception as e:
    print('Error creating GenerativeModel:')
    traceback.print_exc()
    raise SystemExit(2)

print('SMOKE TEST COMPLETE')
