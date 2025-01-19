import { useState, useRef, useEffect } from 'react';
import './App.css';
import axios from 'axios';
import { TiDocumentText } from 'react-icons/ti';
import LoadingIcons from 'react-loading-icons';
import { GiArtificialIntelligence } from 'react-icons/gi';

type Line = {
  LineText: string;
};

interface RedacaoFeedback {
  nota: number;
  pontos_fortes: string[];
  pontos_a_melhorar: string[];
  sugestoes: string[];
  repertorio_possivel: string[];
}

function App() {
  const [image, setImage] = useState<File | null>(null);
  const [, setData] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [lineCount, setLineCount] = useState<number>(0);
  const [displayedText, setDisplayedText] = useState<string>('');
  const [feedback, setRedacaoFeedback] = useState<RedacaoFeedback>();
  const contentEditableRef = useRef<HTMLDivElement>(null);
  const [fontSize, setFontSize] = useState(16);
  const [sendedText, setSendedText] = useState('');
  const editorRef = useRef<HTMLDivElement>(null);
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
      setIsLoading(true);
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

        const parsedText = lines.map((line: Line) => line.LineText).join('\n');
        setData(parsedText);
        setLineCount(0);
        typeText(lines);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleAi = async () => {
    setIsLoading(true);
    try {
      const res = await axios.post(`${process.env.BACKEND}/ai`, {
        data: sendedText
      });
      setRedacaoFeedback(res.data);
      console.log(feedback);
    } catch (err) {
      console.log(err);
    } finally {
      setIsLoading(false);
    }
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
        setSendedText(
          (prev) => prev + lineText.replace(/<br \/>/g, '\n') + '\n '
        );
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
  }, [image]); //eslint-disable-line

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

  const editor_width = {
    width: '100%',
    maxWidth: '864px'
  };

  return (
    <main>
      <div className='main_header'>
        <h1>Digitalize e tenha sua redação corrigida</h1>
        <div>
          <p>
            Transforme suas redações manuscritas em digitais com facilidade e
            eficiência. Tenha sua redação corrigida com um simples toque de um
            botão.
          </p>
        </div>
        <ul>
          <li>Evite letras manuscritas para maior precisão na digitalização</li>
          <li>
            Mantenha entre 10-15 palavras por linha para melhor legibilidade
          </li>
          <li>Use parágrafos curtos para facilitar a leitura e compreensão</li>
          <li>
            Revise seu texto após a digitalização para corrigir possíveis erros
          </li>
          <li>
            Tenha em mente que o texto digitalizado pode apresentar pequenos
            erros
          </li>
          <li>Para melhor edição evite usar em celulares</li>
        </ul>
      </div>

      <div
        className='container'
        ref={editorRef}
        style={
          contentEditableRef.current &&
          contentEditableRef.current.innerText !== ''
            ? { minWidth: '540px', width: 'max-content', maxWidth: '1280px' }
            : editor_width
        }
      >
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
            {sendedText && (
              <button
                style={{ cursor: btn }}
                onClick={() => {
                  setImage(null);
                  setDisplayedText('');
                  setLineCount(0);
                  setSendedText('');
                  contentEditableRef.current!.innerText = '';
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
          onInput={() => {
            setSendedText(contentEditableRef.current?.innerText || '');
          }}
          dangerouslySetInnerHTML={{ __html: displayedText }}
        />
        <div className='footer'>
          {sendedText && contentEditableRef.current?.innerText !== '' && (
            <button
              type='button'
              style={{ cursor: btn }}
              disabled={isLoading}
              onClick={handleAi}
            >
              {!isLoading ? (
                <GiArtificialIntelligence size={25} />
              ) : (
                <LoadingIcons.Grid color='white' height={20} width={20} />
              )}
            </button>
          )}
          <p>{lineCount > 0 && `Linhas ${lineCount}`}</p>
        </div>
      </div>
      {feedback && (
        <div
          className='container'
          style={{ width: editorRef && editorRef.current?.offsetWidth }}
        >
          <div className='response_container'>
            <h2>Nota {feedback.nota}</h2>
            <div>
              <strong>Pontos fortes:</strong>
              {feedback.pontos_fortes.map((ponto, index) => (
                <p key={index}>{ponto}</p>
              ))}
            </div>
            <div>
              <strong>Pontos a melhorar:</strong>
              {feedback.pontos_a_melhorar.map((ponto, index) => (
                <p key={index}>{ponto}</p>
              ))}
            </div>
            <div>
              <strong>Sugestões:</strong>
              {feedback.sugestoes.map((obs, index) => (
                <p key={index}>{obs}</p>
              ))}
            </div>

            <div>
              <strong>Repertório possivel:</strong>
              {feedback.repertorio_possivel.map((obs, index) => (
                <p key={index}>{obs}</p>
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default App;
