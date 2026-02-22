import { Injectable, Signal, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class RestApiServiceService {
  public url: string = 'http://frontend.localhost/api';
  private tokenKey = 'authToken'
  isLoggedIn = signal(false);
  constructor(private http: HttpClient) {}


  login(username: string, password: string): Observable<any> {
    const res = this.http.post(this.url  + '/auth/login', {username, password}).pipe(
      tap((response: any) => {
        if (response.token) {
          localStorage.setItem(this.tokenKey, response.token)
        }
      })
    );
    console.log('Login response:', res);
    this.isLoggedIn.set(true);
    return res;
  }

    logout(): void {
    localStorage.removeItem(this.tokenKey)
    this.isLoggedIn.set(false);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey)
  }



  getProfile(): Observable<any> {
    const token = this.getToken();
    const headers = new HttpHeaders(token ? { Authorization: `Bearer ${token}`} : {})
    return this.http.get(this.url + '/user/profile', {headers});

  }


  //posts
  //lista posts

  getPosts(): Observable<any> {
    return this.http.get(this.url + '/public/post');
  }

  //crear un post
  createPost(content: string): Observable<any> {
    const token = this.getToken();
    const headers = new HttpHeaders(token ? { Authorization: `Bearer ${token}`} : {});
    return this.http.post(this.url + '/post', {content}, {headers});
  }

  //eliminar un post
  deletePost(postId: string): Observable<any> {
    const token = this.getToken();
    const headers = new HttpHeaders(token ? { Authorization: `Bearer ${token}`} : {});
    return this.http.delete(this.url + '/post/' + postId, {headers});
  }

  //lista comentario de un post
  getComments(postId: number): Observable<any> {
    return this.http.get(this.url + '/comment/' + postId.toString());
  }

  //crea un comentario en un post 
  createComment(postId: string, content: string): Observable<any> {
   const token = this.getToken();
   const headers = new HttpHeaders(token ? { Authorization: `Bearer ${token}`} : {});
   return this.http.post(this.url + '/comment', { postId: postId, content }, { headers });
}

  //eliminar un comentario solo si es el dueño
  deleteComment(commentId: string): Observable<any> {
    const token = this.getToken();
    const headers = new HttpHeaders(
      token ? { Authorization: `Bearer ${token}` } : {}
    );

    return this.http.delete(this.url + '/comment/' + commentId, { headers });
  }

  //eliminar comentarios de un post
  deleteCommentsByPost(postId: string): Observable<any> {
    const token = this.getToken();
    const headers = new HttpHeaders(token ? { Authorization: `Bearer ${token}`} : {});
    return this.http.delete(this.url + '/comment/' + postId, {headers});
  }

   getLikes(postId: number): Observable<any> {
    return this.http.get(`${this.url}/like/count/${postId}`);
  }

  toggleLike(postId: number): Observable<any> {
    const token = this.getToken();
    const headers = new HttpHeaders(token ? { Authorization: `Bearer ${token}` } : {});
    return this.http.post(`${this.url}/like/toggle/${postId}`, {}, { headers });
  }

  checkLike(postId: number): Observable<any> {
    const token = this.getToken();
    const headers = new HttpHeaders(token ? { Authorization: `Bearer ${token}` } : {});
    return this.http.get(`${this.url}/like/check/${postId}`, { headers });
  }

  deleteLike(likeId: string): Observable<any> {
    const token = this.getToken();
    const headers = new HttpHeaders(token ? { Authorization: `Bearer ${token}` } : {});
    return this.http.delete(`${this.url}/like/${likeId}`, { headers });
  }
}