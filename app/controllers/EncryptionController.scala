package controllers

import javax.inject.Inject

import play.api.libs.json._
import play.api.mvc._
import play.modules.reactivemongo._
import reactivemongo.api.ReadPreference
import reactivemongo.play.json._
import reactivemongo.play.json.collection._

import scala.concurrent.{ExecutionContext, Future}

class EncryptionController @Inject() (val reactiveMongoApi: ReactiveMongoApi)(implicit ec: ExecutionContext)
  extends Controller with MongoController with ReactiveMongoComponents {

  def index = Action {
    Ok(views.html.encrypt())
  }

  def upload = Action.async(parse.json) { request =>
    photosCollection
      .flatMap(_.insert(request.body.asInstanceOf[JsObject]))
      .map(writeResult => Ok(s"Upload result: $writeResult"))
  }

  def download(filename: String) = Action.async {
    photosCollection
      .flatMap(findOneByFilename(filename))
      .map(Ok(_))
  }

  private def findOneByFilename(filename: String)(photos: JSONCollection): Future[JsObject] =
    photos.find(Json.obj("filename" -> filename))
      .cursor[JsObject](ReadPreference.secondaryPreferred)
      .collect[List]()
      .map(_.head)

  private def photosCollection: Future[JSONCollection] =
    database.map(_.collection[JSONCollection]("photos"))
}
