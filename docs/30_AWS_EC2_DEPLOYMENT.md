# QR角印のインストール例



実際にAmazon EC2インスタンスにQR角印をインストールしてみる手順を記録したものです。どうぞ参考にしてください。

## EC2インスタンスを作成する

Amazon AMI Linux のインスタンスを作ります

- AMI=**Amazon Linux 2 AMI (HVM), SSD Volume Type** 
- instance=**t2.nano**

 セキュリティグループの設定で、TCP/443を受け付けるようにします

タイムゾーンをAsia/Tokyoに変更します



### gitをインストールする

新しいEC2インスタンスに、ec2-userとしてsshでログインして、gitをインストールします

```
$ sudo yum update
$ sudo yum -y install git
```

### nvmをインストール

```
git clone https://github.com/creationix/nvm.git ~/.nvm
```

ホームフォルダに.nvmフォルダが作成され, .nvm/nvm.shを取り込むと、nvmにパスが通ります

```
$ source .nvm/nvm.sh
$ nvm -versison
0.35.3
```

起動と同時にパスを通すようにします

~/.bashrc を編集して、下記を追加します

```
. .nvm/nvm.sh
```

これでいつでもパスが通ります

### nodejsをインストール

これで最新のLTS版がインストールされます

```
nvm install --lts
```

最新が12.16.2だと

~/.nvm/versions/node/v12.16.2 フォルダに実際のnodejsがインストールされます



## qrstampをインストール

プロジェクトフォルダを作成します

```
$ mkdir qrstest
$ cd qrstest
$ git clone https://github.com/kunikazuokada/qrstamp.git

$ cd qrstamp
$ npm install

```

これで基本的にはインストールされる、はずです。



### stamp.jsを最低限カスタマイズ

下記の箇所を編集します

- urlbase を、EC2インスタンスのIPアドレス・FQDNに合わせて変えます

実行

```
$ npm start
```

これで、TCP/3000ポートでHTTPアクセスできるようになります

#### 安定稼働させるには

qrstampプロジェクトフォルダで下記のように実行します

```
$ NODE_ENV=production
$ export NODE_ENV

$ nohup forever start ./bin/www &
```

※foreverをつかうにはあらかじめ下記でインストールしておきます

```
$ npm install -g forever
```



## フロントエンドにnginxプロキシを立てる

HTTPアクセスをインターネットにさらすべきではありませんし、実運用ではQR角印発行ページは一般ユーザに非公開とすべきです。

そのため、フロントエンドに認証用のリバースプロキシサーバを立てる必要があります。

ここでは、nginxをプロキシサーバとする例を説明します

### nginxをインストール

```
$ sudo amazon-linux-extras install nginx1.12 -y
```

nginxの設定

```
$ cd /etc/nginx
$ sudo nginx.conf
```

これで編集できます

nginx.conf に下記のようなエントリを作りました

```
    server {
        listen       443 ssl;
        server_name  qrstamp.example.com;

        location /qrstamp{
                proxy_pass http://127.0.0.1:3000/qrstamp;
        }
        ssl on;
        ssl_certificate "/etc/nginx/ssl/example.com/example.com.bundle.crt";
        ssl_certificate_key "/etc/nginx/ssl/example.com/example.com.privatekey.txt";

　　(以下略）
```

これでインターネットから、捺印情報ページが参照できるようになります



### QR角印生成画面へのアクセスはどうする？

上記の設定では、生成画面 `/admin/newStamp.html`はインターネットに公開されないため、QR角印生成画面にアクセスするには、LAN内などから 3000番ポートにアクセスしなければなりません。

- たとえば、端末PCからSSHでQR角印サーバに接続し、3000番ポートをトンネリングするなどの方法で、角印生成画面（http://ホスト名:3000/admin/newStamp.html）にアクセスしてください。

- nginxに認証させて、location /admin についてもリバースプロキシ経由でアクセスさせることも可能ですが、本文書ではそこまで書きません。

  

