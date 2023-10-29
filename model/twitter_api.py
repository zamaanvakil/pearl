from distutils.command.config import config
from os import access
import tweepy
import configparser
import pandas as pd

# read config file
config = configparser.ConfigParser()
config.read('config.ini')

api_key = config['twitter']['api_key']
api_key_secret = config['twitter']['api_key_secret']

access_token = config['twitter']['access_token']
access_token_secret = config['twitter']['access_token_secret']

#authentication
auth= tweepy.OAuthHandler(api_key, api_key_secret)
auth.set_access_token(access_token, access_token_secret)

api = tweepy.API(auth)

def tweets_to_csv(user_id):
    columns = ['DateTime', 'Text']
    data = []
    for tweet in tweepy.Cursor(api.user_timeline,screen_name=user_id).items():
        # data.append([tweet.created_at.strftime("%m/%d/%Y %H:%M:%S"), tweet.text])
        data.append([tweet.created_at, tweet.text])

    df = pd.DataFrame(data,columns=columns)
    df.sort_values(by=['DateTime'],inplace=True)
    df.to_csv(f"tweet_dataset/{user_id}.csv", index=False)
    print(f"Completed dump of {len(data)} tweets of user {user_id}.")


if __name__=="__main__":
    # user_ids = ["h3h3productions", "chrisbryanASU","elonmusk", "POTUS", "hasanthehun"]
    # user_ids = ["realDonaldTrump", "MrBeast","MKBHD", "drewisgooden", "GretaThunberg"]
    user_ids= ["h3h3productions"]
    for user_id in user_ids:
        tweets_to_csv(user_id)
    
        







