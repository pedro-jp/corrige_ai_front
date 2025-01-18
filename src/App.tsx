import { useState, useRef, useEffect } from 'react';
import './App.css';
import axios from 'axios';
import { TiDocumentText } from 'react-icons/ti';
import LoadingIcons from 'react-loading-icons';

function App() {
  const [image, setImage] = useState<File | null>(null);
  const [, setData] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false); // Bloqueio de requisições
  const [lineCount, setLineCount] = useState<number>(0);
  const [displayedText, setDisplayedText] = useState<string>('');
  const contentEditableRef = useRef<HTMLDivElement>(null);
  const [fontSize, setFontSize] = useState(16);
  const formData = new FormData();

  if (image) {
    formData.append('file', image);
    formData.append('language', 'por');
    formData.append('isOverlayRequired', 'true');
    formData.append('scale', 'true');
    formData.append('OCREngine', '2');
  }

  const handleSendImage = async () => {
    if (image && !isLoading) {
      setIsLoading(true); // Bloqueia novas requisições
      try {
        const response = await axios.post(
          'https://api.ocr.space/parse/image',
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
              apiKey: process.env.APIKEY
            }
          }
        );

        const parsedResults = response.data.ParsedResults[0];
        const lines = parsedResults.TextOverlay.Lines;

        const parsedText = lines.map((line: any) => line.LineText).join('\n'); //eslint-disable-line
        setData(parsedText);
        setLineCount(0);
        typeText(lines);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false); // Libera novas requisições
      }
    }
  };

  type Line = {
    LineText: string;
  };

  const typeText = (lines: Line[]) => {
    let index = 0;

    setDisplayedText('');
    const interval = setInterval(() => {
      if (index < lines.length) {
        let lineText = lines[index].LineText;
        if (lineText.trim() !== '') {
          lineText = `${lineText}`;
        }
        if (lineText.endsWith('.') || lineText.endsWith('. ')) {
          lineText += '<br />';
        }
        setDisplayedText((prev) => prev + lineText + '<br />');
        index++;
        setLineCount(index);
      } else {
        clearInterval(interval);
        setIsLoading(false);
      }
    }, 50);
  };

  const updateLineCount = () => {
    if (contentEditableRef.current) {
      const lines = contentEditableRef.current.innerText
        .split('\n')
        .filter((line) => line.trim() !== '');
      setLineCount(lines.length);
    }
  };

  useEffect(() => {
    if (image) {
      handleSendImage();
    }
  }, [image]);

  useEffect(() => {
    const textContainer = contentEditableRef.current;
    if (textContainer) {
      textContainer.addEventListener('input', updateLineCount);
      return () => {
        textContainer.removeEventListener('input', updateLineCount);
      };
    }
  }, []);

  const btn = isLoading ? 'not-allowed' : 'pointer';

  return (
    <main>
      <div className='container'>
        <div className='header'>
          <h2>Editor</h2>
          <div className='editor_settings'>
            <div className='font_size'>
              <button onClick={() => setFontSize(fontSize - 1)}>
                <strong>-</strong>
              </button>
              {fontSize}
              <button onClick={() => setFontSize(fontSize + 1)}>
                <strong>+</strong>
              </button>
            </div>
          </div>
          <div>
            {displayedText && (
              <button
                style={{ cursor: btn }}
                onClick={() => {
                  setImage(null);
                  setDisplayedText('');
                  setLineCount(0);
                }}
              >
                Limpar
              </button>
            )}
            <button className='scan' style={{ cursor: btn }}>
              <input
                type='file'
                accept='image/*'
                onChange={(e) => setImage(e.target.files?.[0] || null)}
                style={{ cursor: btn }}
              />
              {!isLoading ? (
                <TiDocumentText size={25} color='white' />
              ) : (
                <LoadingIcons.Grid color='white' height={20} width={20} />
              )}
            </button>
          </div>
        </div>
        <div
          className='editor_container'
          ref={contentEditableRef}
          style={{ fontSize: `${fontSize}px` }}
          contentEditable
          dangerouslySetInnerHTML={{ __html: displayedText }}
        />
        <div className='footer'>
          <p>{lineCount > 0 && `Linhas ${lineCount}`}</p>
        </div>
      </div>
    </main>
  );
}

export default App;
