import 'dotenv/config';

async function getAvailableModels() {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('❌ خطأ: لم يتم العثور على مفتاح GEMINI_API_KEY داخل ملف .env');
      return;
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await response.json();
    
    if (data.error) {
      console.error('❌ خطأ من الخادم:', data.error.message);
      return;
    }

    if (!data.models) {
      console.error('❌ لم يتم العثور على أي موديلات متاحة.');
      return;
    }

    const validModels = data.models
      .filter(m => m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent'))
      .map(m => m.name.replace('models/', ''));
    
    console.log('✅ الموديلات المتاحة والمدعومة لمفتاحك حالياً هي:');
    validModels.forEach(model => console.log(`- ${model}`));
    
  } catch (error) {
    console.error('❌ فشل الاتصال بالشبكة:', error.message);
  }
}

getAvailableModels();