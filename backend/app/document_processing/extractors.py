import os
import re
import logging
from typing import Dict, Any, List, Tuple
import fitz  # PyMuPDF
from pptx import Presentation

logger = logging.getLogger(__name__)

class DocumentExtractor:
    @staticmethod
    def extract_from_file(file_path: str, file_type: str) -> Tuple[str, List[Dict[str, Any]], int]:
        """
        Extract text from file preserving page/slide boundaries.
        Returns:
            - full_text: string with all content concatenated
            - pages_data: list of dicts with {'page_or_slide': int, 'content': str}
            - count: total pages/slides
        """
        file_type = file_type.lower().replace(".", "")
        if file_type == "pdf":
            return DocumentExtractor._extract_pdf(file_path)
        elif file_type in ["pptx", "ppt"]:
            return DocumentExtractor._extract_pptx(file_path)
        elif file_type in ["txt", "text", "md"]:
            return DocumentExtractor._extract_txt(file_path)
        else:
            raise ValueError(f"Formato de arquivo não suportado: {file_type}")

    @staticmethod
    def _extract_pdf(file_path: str) -> Tuple[str, List[Dict[str, Any]], int]:
        pages_data = []
        full_text_parts = []
        
        try:
            doc = fitz.open(file_path)
            total_pages = len(doc)
            
            for page_num in range(total_pages):
                page = doc.load_page(page_num)
                text = page.get_text("text").strip()
                if text:
                    # Clean repeated whitespaces
                    cleaned_text = re.sub(r"[ \t]+", " ", text)
                    pages_data.append({
                        "page_or_slide": page_num + 1,
                        "content": cleaned_text
                    })
                    full_text_parts.append(f"--- [Página {page_num + 1}] ---\n{cleaned_text}")
            
            doc.close()
            full_text = "\n\n".join(full_text_parts)
            return full_text, pages_data, total_pages
        except Exception as e:
            logger.error(f"Erro ao extrair PDF {file_path}: {e}")
            raise RuntimeError(f"Falha ao ler arquivo PDF: {str(e)}")

    @staticmethod
    def _extract_pptx(file_path: str) -> Tuple[str, List[Dict[str, Any]], int]:
        slides_data = []
        full_text_parts = []
        
        try:
            prs = Presentation(file_path)
            total_slides = len(prs.slides)
            
            for slide_num, slide in enumerate(prs.slides, start=1):
                slide_texts = []
                for shape in slide.shapes:
                    if shape.has_text_frame:
                        for paragraph in shape.text_frame.paragraphs:
                            text = paragraph.text.strip()
                            if text:
                                slide_texts.append(text)
                
                slide_content = "\n".join(slide_texts)
                if slide_content:
                    slides_data.append({
                        "page_or_slide": slide_num,
                        "content": slide_content
                    })
                    full_text_parts.append(f"--- [Slide {slide_num}] ---\n{slide_content}")
            
            full_text = "\n\n".join(full_text_parts)
            return full_text, slides_data, total_slides
        except Exception as e:
            logger.error(f"Erro ao extrair PPTX {file_path}: {e}")
            raise RuntimeError(f"Falha ao ler arquivo PowerPoint: {str(e)}")

    @staticmethod
    def _extract_txt(file_path: str) -> Tuple[str, List[Dict[str, Any]], int]:
        try:
            content = ""
            for encoding in ["utf-8", "latin-1", "cp1252"]:
                try:
                    with open(file_path, "r", encoding=encoding) as f:
                        content = f.read()
                    break
                except UnicodeDecodeError:
                    continue
            
            # Split into virtual pages of ~3000 chars or paragraphs
            paragraphs = content.split("\n\n")
            pages_data = []
            current_page_text = []
            current_len = 0
            page_index = 1
            
            for p in paragraphs:
                p_clean = p.strip()
                if not p_clean:
                    continue
                current_page_text.append(p_clean)
                current_len += len(p_clean)
                if current_len >= 2500:
                    pages_data.append({
                        "page_or_slide": page_index,
                        "content": "\n\n".join(current_page_text)
                    })
                    page_index += 1
                    current_page_text = []
                    current_len = 0
                    
            if current_page_text:
                pages_data.append({
                    "page_or_slide": page_index,
                    "content": "\n\n".join(current_page_text)
                })
                
            return content, pages_data, len(pages_data) or 1
        except Exception as e:
            logger.error(f"Erro ao extrair TXT {file_path}: {e}")
            raise RuntimeError(f"Falha ao ler arquivo de texto: {str(e)}")
