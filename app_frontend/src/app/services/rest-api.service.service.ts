import { Injectable, Signal, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class RestApiServiceService {
  public url: string = 'http://localhost:3007';
  private tokenKey = 'authToken'
  isLoggedIn = signal(false);
  constructor(private http: HttpClient) {}


  login(username: string, password: string): Observable<any> {
    const res = this.http.post(this.url + '/login', {username, password}).pipe(
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
    return this.http.get(this.url + '/profile', {headers});

  }

  //posts
  //lista posts

  getPosts(): Observable<any> {
    return this.http.get(this.url + '/posts');
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
    return this.http.get(this.url + '/comments/' + postId.toString());
  }

  //crea un comentario en un post 
  createComment(postId: string, content: string): Observable<any> {
   const token = this.getToken();
   const headers = new HttpHeaders(token ? { Authorization: `Bearer ${token}`} : {});
   return this.http.post(this.url + '/comment', { postId: postId, content }, { headers });
}

  //eliminar un comentario
  deleteComment(commentId: string): Observable<any> {
    const token = this.getToken();
    const headers = new HttpHeaders(token ? { Authorization: `Bearer ${token}`} : {});
    return this.http.delete(this.url + '/comment/' + commentId, {headers});
  }

  //contar likes de un post
  getLikes(postId: number): Observable<any> {
    return this.http.get(this.url + '/likes/' + postId);
  }


  //toggle like
  toggleLike(postId: number): Observable<any> {
    const token = this.getToken();
    const headers = new HttpHeaders(token ? { Authorization: `Bearer ${token}`} : {});
    return this.http.post(this.url + '/togglelike', {postId}, {headers});
  }

  //check like
  checkLike(postId: number): Observable<any> {
    const token = this.getToken();
    const headers = new HttpHeaders(token ? { Authorization: `Bearer ${token}`} : {});
    return this.http.get(this.url + `/checklike/${postId}`, {headers});
  }

  //eliminar un like
  deleteLike(likeId: string): Observable<any> {
    const token = this.getToken();
    const headers = new HttpHeaders(token ? { Authorization: `Bearer ${token}`} : {});
    return this.http.delete(this.url + '/like/' + likeId, {headers});
  }
}