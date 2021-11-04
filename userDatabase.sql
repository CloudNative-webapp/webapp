create table custuser(
    user_uid UUID DEFAULT uuid_generate_v4(),
    username VARCHAR(100) NOT NULL,
    password VARCHAR(100) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    account_created timestamp with time zone,
    account_updated timestamp with time zone,
    PRIMARY KEY (user_uid)
);

create table usermetadata(file_name VARCHAR(200) NOT NULL,
						  id UUID DEFAULT uuid_generate_v4(),
						  url VARCHAR(200) NOT NULL, 
						  upload_date DATE NOT NULL, 
						  user_id UUID
						  REFERENCES custuser(user_uid));

UPDATE public."user"
	SET password='error@1234', first_name='sne', last_name='ch'
	WHERE username='snec@gmail.com';