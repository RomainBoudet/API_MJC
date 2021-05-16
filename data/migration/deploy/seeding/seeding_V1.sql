-- Deploy Guardians_of_the_legend:seeding/seeding_V1 to pg

BEGIN;

INSERT INTO "group" ("name") VALUES
('Membre'),
('Administrateur'),
('Modérateur');


INSERT INTO "game_type" ("name") VALUES
('Jeux de base'),
('Extension');


INSERT INTO "game_tag" ("name") VALUES
('Jeux de Plateaux'),
('Jeux de Rôle'),
('Jeux de Rôle Grandeur Nature'),
('Jeux de Cartes'),
('Jeux de Figurines');


INSERT INTO "article_tag" ("name") VALUES
('News'),
('Évenement'),
('Salons');


INSERT INTO "event_tag" ("name") VALUES
('Soirée Jeux'),
('Murder Party'),
('Jeux de Rôle');


INSERT INTO "game" ("title", "min_player", "max_player", "min_age", "duration", "quantity", "purchased_date", "creator", "editor", "description", "year", "type_id") VALUES
('Les Colons de Catane', 3, 4, 10, '75 minutes' , 2, '2021-01-17', 'Klaus Teuber', 'Kosmos', 'Vous êtes à la tête d’une expédition ayant pour mission de coloniser l’île de Catane. Les ouvrages des Explorateurs décrivent cette île comme un paradis où abondent toutes les richesses nécessaires pour y construire de prospères cités....Mais vous n''êtes pas seul ! Les premières colonies fondées croissent rapidement. L''espace devient de plus en plus rare et les échanges commerciaux de plus en plus nécessaires. Vous devrez donc utiliser à profit vos talents de négociateur ! Une grande aventure vous attend. Deviendrez-vous le premier souverain de Catane?', 1995, 1),
('7 Wonders', 2, 7, 10, '30 minutes', 1, '2018-01-17', 'Antoine Bauza','Asmodee', 'L''Antiquité et ses merveilles. Revivez l''épopée des grandes constructions avec ce jeu de cartes et de stratégie !
7 Wonders est un jeu de cartes et de stratégie qui vous propose de prendre la tête d’une prestigieuse civilisation et de la faire prospérer jusqu’à la victoire.', 2010, 1);

INSERT INTO "user" ("first_name", "last_name", "pseudo","email_address", "password", "group_id", "verifyemail" ) VALUES
('Agathe', 'Zeublouze', 'agathe', 'lesgardiensdelalegende@gmail.com', '$2b$10$B1NL.FDCv0sXi/o7ED5AwuGvbGqu6fIwF1KO83Nu77c5c8kxIEqpG', 1, 'true'),
('Alex', 'Kuzbidon', 'alex', '2lesgardiensdelalegende@gmail.com', '$2b$10$LMqOrl1nLJNkPnzygSpvre6hqtx9UjmQj7dv6JlmLJRO8UslV4B0y', 2, 'true'),
('Clement', 'Tine', 'clement', '3lesgardiensdelalegende@gmail.com', '$2b$10$opGVGReCUqhCZbNuYJkLquN7h1XcWNVgNXm7MBQWzwsa/zDyu51ia', 3, 'true'),
('Désirée', 'Duktible', 'daisy', '4lesgardiensdelalegende@gmail.com', '$2b$10$QOX/d3NOjRL.6mQzIZfpi.ijpMb7ZTEohzFI3DaKdVNGNm.9zfRYq', 1, 'true');

INSERT INTO "review" ("title", "description", "game_id", "author_id") VALUES
('Un jeu de folie !', 'J''ai joué de nombreuses heures et je ne m''en suis toujours pas lassé', 1, 1 );

INSERT INTO "event" ("title", "description", "event_date", "creator_id", "tag_id") VALUES
('Une envie de tuer ? ', 'Vous serez le/la bienvenue pour tuer vos amis...', '2021-04-03 20:00', 2, 2),
('Soirée Jeux', 'Si vous voulez nous rejoindre pour une soirée, vous êtes le/la bienvenue !', '2021-06-01 19:00', 1, 1);

INSERT INTO event_has_game(event_id, game_id) VALUES
(2, 1),
(2, 2);

INSERT INTO "tag_has_game"("tag_id", "game_id") VALUES
(1, 1),
(2, 1),
(1, 2);

INSERT INTO "event_has_participant"("event_id", "user_id") VALUES
(1, 1),
(1, 2),
(2, 1);


COMMIT;
