import { requestUrl, RequestUrlParam } from 'obsidian';

export interface IMACredentials {
  clientId: string;
  apiKey: string;
}

export class IMAClient {
  private baseUrl = 'https://ima.qq.com';
  private clientId: string;
  private apiKey: string;

  constructor(credentials: IMACredentials) {
    this.clientId = credentials.clientId;
    this.apiKey = credentials.apiKey;
  }

  private async request(path: string, body: any): Promise<any> {
    const url = `${this.baseUrl}/${path}`;
    const params: RequestUrlParam = {
      url,
      method: 'POST',
      headers: {
        'ima-openapi-clientid': this.clientId,
        'ima-openapi-apikey': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      throw: false,
    };

    const response = await requestUrl(params);
    
    if (response.status < 200 || response.status >= 300) {
      throw new Error(`IMA API error: ${response.status} ${response.text}`);
    }
    
    const data = JSON.parse(response.text);
    
    if (data.error_code && data.error_code !== 0) {
      throw new Error(`IMA API error: ${data.error_code} ${data.error_msg || ''}`);
    }
    
    return data.data;
  }

  // 搜索笔记
  async searchNotes(query: string, searchType = 0): Promise<any> {
    const body = {
      search_type: searchType,
      query_info: searchType === 0 ? { title: query } : { content: query },
      start: 0,
      end: 20,
    };
    return this.request('openapi/note/v1/search_note_book', body);
  }

  // 获取笔记本列表
  async listNotebooks(cursor = '0', limit = 20): Promise<any> {
    const body = { cursor, limit };
    return this.request('openapi/note/v1/list_note_folder_by_cursor', body);
  }

  // 获取笔记列表（按笔记本）
  async listNotes(folderId = '', cursor = '', limit = 20): Promise<any> {
    const body = { folder_id: folderId, cursor, limit };
    return this.request('openapi/note/v1/list_note_by_folder_id', body);
  }

  // 获取笔记内容
  async getNoteContent(docId: string, format = 0): Promise<any> {
    const body = { doc_id: docId, target_content_format: format };
    return this.request('openapi/note/v1/get_doc_content', body);
  }

  // 创建笔记
  async createNote(content: string, folderId?: string): Promise<any> {
    const body: any = { content_format: 1, content };
    if (folderId) body.folder_id = folderId;
    return this.request('openapi/note/v1/import_doc', body);
  }

  // 追加内容到笔记
  async appendToNote(docId: string, content: string): Promise<any> {
    const body = { doc_id: docId, content_format: 1, content };
    return this.request('openapi/note/v1/append_doc', body);
  }
}
